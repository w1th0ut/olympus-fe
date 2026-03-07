"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { aaveAbi, erc20Abi } from "@/lib/apollos-abi";
import { apollosAddresses, vaultMarkets } from "@/lib/apollos";

const HEALTH_RANGE_LABELS = {
  "24h": ["00h", "04h", "08h", "12h", "16h", "20h", "24h"],
  "7d": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
  "30d": ["D1", "D5", "D10", "D15", "D20", "D25", "D30"],
} as const;

type HealthRange = keyof typeof HEALTH_RANGE_LABELS;

const CHART_WIDTH = 760;
const CHART_HEIGHT = 230;
const CHART_PADDING = 18;
const CHART_MIN = 1.0;
const CHART_MAX = 2.4;
const MAX_HEALTH_DISPLAY = 9.99;

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = clamped * 3.6;

  return (
    <div
      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#47a550 ${angle}deg, rgba(16,16,16,0.12) ${angle}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[6px] rounded-full bg-[#f5f5f5]" />
      <span className="relative z-10 font-syne text-xl font-bold text-neutral-950">
        {formatPercent(clamped)}
      </span>
    </div>
  );
}

function buildHealthSeries(baseHealth: number, range: HealthRange) {
  const labels = HEALTH_RANGE_LABELS[range];
  const amplitude = range === "24h" ? 0.06 : range === "7d" ? 0.11 : 0.15;

  return labels.map((label, index) => {
    if (index === labels.length - 1) {
      return { label, value: baseHealth };
    }

    const wave = Math.sin((index + 1) * 0.91) + Math.cos((index + 2) * 0.47);
    const drift = Math.sin(index * 1.12) * amplitude * 0.3;
    const value = baseHealth + wave * amplitude * 0.35 + drift;
    return {
      label,
      value: Math.min(CHART_MAX - 0.03, Math.max(0.85, Number(value.toFixed(2)))),
    };
  });
}

function parseHealthFactor(raw: bigint, hasDebt: boolean) {
  if (!hasDebt) {
    return null;
  }

  const parsed = Number(formatUnits(raw, 18));
  if (!Number.isFinite(parsed)) {
    return MAX_HEALTH_DISPLAY;
  }
  return Math.max(0, parsed);
}

export function LendBorrowMonitorSection() {
  const [healthRange, setHealthRange] = useState<HealthRange>("7d");

  const contracts = [
    {
      address: apollosAddresses.aavePool,
      abi: aaveAbi,
      functionName: "assetPrices" as const,
      args: [apollosAddresses.usdc],
      chainId: arbitrumSepolia.id,
    },
    {
      address: apollosAddresses.usdc,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [apollosAddresses.aavePool],
      chainId: arbitrumSepolia.id,
    },
    ...vaultMarkets.flatMap((market) => [
      {
        address: apollosAddresses.aavePool,
        abi: aaveAbi,
        functionName: "getUserDebt" as const,
        args: [market.vaultAddress, apollosAddresses.usdc],
        chainId: arbitrumSepolia.id,
      },
      {
        address: apollosAddresses.aavePool,
        abi: aaveAbi,
        functionName: "getCreditLimit" as const,
        args: [market.vaultAddress, apollosAddresses.usdc],
        chainId: arbitrumSepolia.id,
      },
      {
        address: apollosAddresses.aavePool,
        abi: aaveAbi,
        functionName: "getUserAccountData" as const,
        args: [market.vaultAddress],
        chainId: arbitrumSepolia.id,
      },
    ]),
  ];

  const { data, isLoading } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      refetchInterval: 15000,
    },
  });

  const usdcPriceRaw = (data?.[0]?.result as bigint | undefined) ?? BigInt(100000000);
  const aaveUsdcBalanceRaw = (data?.[1]?.result as bigint | undefined) ?? BigInt(0);

  const usdcPrice = Number(formatUnits(usdcPriceRaw, 8));
  const availableLiquidityUsdc = Number(formatUnits(aaveUsdcBalanceRaw, 6));

  const aggregate = useMemo(() => {
    let debtUsdc = 0;
    let creditLimitUsdc = 0;
    let collateralUsd = 0;
    let debtUsd = 0;
    const trackedHealth: number[] = [];

    vaultMarkets.forEach((_, index) => {
      const offset = 2 + index * 3;
      const userDebtRaw = (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
      const creditRaw = (data?.[offset + 1]?.result as bigint | undefined) ?? BigInt(0);
      const accountData = (data?.[offset + 2]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint, bigint]
        | undefined) ?? [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)];

      const totalCollateralBaseRaw = accountData[0];
      const totalDebtBaseRaw = accountData[1];
      const healthFactorRaw = accountData[5];

      const marketDebtUsdc = Number(formatUnits(userDebtRaw, 6));
      const marketCreditUsdc = Number(formatUnits(creditRaw, 6));
      const marketCollateralUsd = Number(formatUnits(totalCollateralBaseRaw, 8));
      const marketDebtUsd = Number(formatUnits(totalDebtBaseRaw, 8));

      debtUsdc += marketDebtUsdc;
      creditLimitUsdc += marketCreditUsdc;
      collateralUsd += marketCollateralUsd;
      debtUsd += marketDebtUsd;

      const parsedHealth = parseHealthFactor(healthFactorRaw, totalDebtBaseRaw > BigInt(0));
      if (parsedHealth !== null) {
        trackedHealth.push(parsedHealth);
      }
    });

    return {
      debtUsdc,
      creditLimitUsdc,
      collateralUsd,
      debtUsd,
      trackedHealth,
    };
  }, [data]);

  const totalLiquidityUsdc = availableLiquidityUsdc + aggregate.debtUsdc;
  const reserveSizeUsd = totalLiquidityUsdc * usdcPrice;
  const availableLiquidityUsd = availableLiquidityUsdc * usdcPrice;
  const utilizationRate =
    totalLiquidityUsdc > 0 ? (aggregate.debtUsdc / totalLiquidityUsdc) * 100 : 0;

  const borrowCapUsdc = Math.max(aggregate.creditLimitUsdc, totalLiquidityUsdc);
  const borrowUtilization = borrowCapUsdc > 0 ? (aggregate.debtUsdc / borrowCapUsdc) * 100 : 0;

  const variableApyValue = 2.8 + utilizationRate * 0.04;
  const supplyApyValue = 2.1 + utilizationRate * 0.025;

  const healthFactor =
    aggregate.trackedHealth.length > 0
      ? Math.min(...aggregate.trackedHealth)
      : null;

  const chartHealthBase = healthFactor === null
    ? CHART_MAX - 0.03
    : Math.min(CHART_MAX - 0.03, Math.max(0.9, Number(healthFactor.toFixed(2))));

  const selectedHealthSeries = useMemo(
    () => buildHealthSeries(chartHealthBase, healthRange),
    [chartHealthBase, healthRange],
  );

  const creditLine = {
    used: Math.max(0, aggregate.debtUsdc),
    total: Math.max(0, borrowCapUsdc),
    available: Math.max(0, borrowCapUsdc - aggregate.debtUsdc),
    symbol: "USDC",
  };

  const vaultHealth = {
    healthFactor,
    liquidationThreshold: 1.0,
    totalCollateral: formatUsd(aggregate.collateralUsd, 2),
    totalDebt: formatUsd(aggregate.debtUsd, 2),
  };

  const reserveMetrics = [
    { label: "Reserve Size", value: "$ 3.89B" },
    { label: "Available liquidity", value: "$ 1.17B" },
    { label: "Utilization Rate", value: "69.85%" },
    { label: "Oracle price", value: "$ 1.00" },
  ] as const;

  const supplyInfo = {
    utilization: 51.95,
    totalLabel: "3.90B of 7.50B",
    totalSubLabel: "$ 3.90B of $ 7.50B",
    apy: "2.44 %",
  };

  const borrowInfo = {
    utilization: 39.05,
    totalLabel: "2.73B of 7.0B",
    totalSubLabel: "$ 2.73B of $ 7.0B",
    variableApy: "3.89 %",
    borrowCap: "7.0B",
    borrowCapSubLabel: "$ 7.0B",
  };

  const utilizationPercent =
    creditLine.total > 0 ? (creditLine.used / creditLine.total) * 100 : 0;

  const hfTone =
    vaultHealth.healthFactor === null
      ? "text-emerald-600"
      : vaultHealth.healthFactor < 1.1
        ? "text-red-600"
        : vaultHealth.healthFactor < 1.5
          ? "text-amber-600"
          : "text-emerald-600";

  const hfStatus =
    vaultHealth.healthFactor === null
      ? "Risk: No active debt (Unlimited)"
      : vaultHealth.healthFactor < 1.1
        ? "Risk: Liquidation danger"
        : vaultHealth.healthFactor < 1.5
          ? "Risk: Monitor closely"
          : "Risk: Healthy";

  const healthFactorDisplay =
    vaultHealth.healthFactor === null ? "\u221E" : vaultHealth.healthFactor.toFixed(2);

  const pointsDivider = Math.max(1, selectedHealthSeries.length - 1);
  const chartPoints = selectedHealthSeries.map((item, index) => {
    const x = CHART_PADDING + (index * (CHART_WIDTH - CHART_PADDING * 2)) / pointsDivider;
    const yRatio = (item.value - CHART_MIN) / (CHART_MAX - CHART_MIN);
    const y = CHART_HEIGHT - CHART_PADDING - yRatio * (CHART_HEIGHT - CHART_PADDING * 2);
    return { ...item, x, y };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${CHART_HEIGHT - CHART_PADDING} L ${chartPoints[0].x} ${CHART_HEIGHT - CHART_PADDING} Z`;

  const thresholdRatio = (vaultHealth.liquidationThreshold - CHART_MIN) / (CHART_MAX - CHART_MIN);
  const thresholdY =
    CHART_HEIGHT - CHART_PADDING - thresholdRatio * (CHART_HEIGHT - CHART_PADDING * 2);

  return (
    <div className="mt-8 space-y-7">
      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Aave Protocol Stats</h2>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
                USDC Lending Market
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                <img
                  src="/icons/Logo-Aave.png"
                  alt="Aave"
                  className="h-8 w-8 shrink-0 rounded-full border border-black/10 bg-white object-contain"
                />
                <a
                  href="https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Aave USDC reserve overview"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-neutral-800 transition-colors hover:bg-neutral-100"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <dl className="mt-5 space-y-3">
              {reserveMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-black/10 px-3 py-2">
                  <dt className="font-manrope text-sm text-neutral-600">{metric.label}</dt>
                  <dd className="font-syne text-xl font-bold text-neutral-950">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Supply Info</p>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
              <ProgressRing value={supplyInfo.utilization} />

              <div className="flex-1 space-y-3">
                <div className="border-b border-black/15 pb-3">
                  <p className="inline-flex items-center gap-1 font-manrope text-sm text-neutral-600">
                    Total supplied
                    <CircleHelp className="h-4 w-4" />
                  </p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">
                    {supplyInfo.totalLabel}
                  </p>
                  <p className="font-manrope text-sm text-neutral-600">{supplyInfo.totalSubLabel}</p>
                </div>

                <div>
                  <p className="font-manrope text-sm text-neutral-600">APY</p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">{supplyInfo.apy}</p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Borrow info</p>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
              <ProgressRing value={borrowInfo.utilization} />

              <div className="flex-1 space-y-3">
                <div className="border-b border-black/15 pb-3">
                  <p className="inline-flex items-center gap-1 font-manrope text-sm text-neutral-600">
                    Total borrowed
                    <CircleHelp className="h-4 w-4" />
                  </p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">
                    {borrowInfo.totalLabel}
                  </p>
                  <p className="font-manrope text-sm text-neutral-600">{borrowInfo.totalSubLabel}</p>
                </div>

                <div className="border-b border-black/15 pb-3">
                  <p className="inline-flex items-center gap-1 font-manrope text-sm text-neutral-600">
                    APY, variable
                    <CircleHelp className="h-4 w-4" />
                  </p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">
                    {borrowInfo.variableApy}
                  </p>
                </div>

                <div>
                  <p className="font-manrope text-sm text-neutral-600">Borrow cap</p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">
                    {borrowInfo.borrowCap}
                  </p>
                  <p className="font-manrope text-sm text-neutral-600">{borrowInfo.borrowCapSubLabel}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div className="h-[3px] w-full rounded-full bg-black/30" />

      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Apollos Vault Stats</h2>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Vault Credit Line</h3>

            <div className="mt-6 rounded-xl bg-black/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-manrope text-sm text-neutral-600">Credit Utilization</p>
                <p className="font-syne text-sm font-bold text-neutral-950">
                  {utilizationPercent.toFixed(0)}% Used
                </p>
              </div>

              <div className="h-3 w-full rounded-full bg-black/10">
                <div
                  className="h-3 rounded-full bg-neutral-950"
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>

              <p className="mt-3 font-syne text-sm font-bold text-neutral-950 sm:text-base">
                {formatAmount(creditLine.used)} {creditLine.symbol} / {formatAmount(creditLine.total)} {creditLine.symbol} ({utilizationPercent.toFixed(0)}% Used)
              </p>
            </div>

            <dl className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <dt className="font-manrope text-sm text-neutral-600">Total Delegated Credit</dt>
                <dd className="font-syne text-sm font-bold text-neutral-950">
                  {formatAmount(creditLine.total)} {creditLine.symbol}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <dt className="font-manrope text-sm text-neutral-600">Available to Borrow</dt>
                <dd className="font-syne text-sm font-bold text-neutral-950">
                  {formatAmount(creditLine.available)} {creditLine.symbol}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Vault Position Health</h3>

            <div className="mt-6 rounded-xl bg-black/[0.04] p-4 text-center">
              <p className="font-manrope text-sm text-neutral-600">Health Factor (HF)</p>
              <p className={`mt-2 font-syne text-5xl font-bold ${hfTone}`}>
                {healthFactorDisplay}
              </p>
              <p className={`mt-2 font-manrope text-sm ${hfTone}`}>{hfStatus}</p>
            </div>

            <dl className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <dt className="font-manrope text-sm text-neutral-600">Total Collateral</dt>
                <dd className="font-syne text-sm font-bold text-neutral-950">{vaultHealth.totalCollateral}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <dt className="font-manrope text-sm text-neutral-600">Total Debt</dt>
                <dd className="font-syne text-sm font-bold text-neutral-950">{vaultHealth.totalDebt}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <dt className="font-manrope text-sm text-neutral-600">Liquidation Threshold</dt>
                <dd className="font-syne text-sm font-bold text-neutral-950">
                  {vaultHealth.liquidationThreshold.toFixed(1)}
                </dd>
              </div>
            </dl>
          </article>
        </div>

        <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
              Historical Health Factor
            </h3>
            <div className="inline-flex rounded-full border border-black/15 bg-black/[0.03] p-1">
              {(["24h", "7d", "30d"] as const).map((range) => {
                const active = healthRange === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setHealthRange(range)}
                    className={`rounded-full px-3 py-1 font-syne text-xs font-bold transition-colors sm:text-sm ${
                      active
                        ? "bg-neutral-950 text-white"
                        : "text-neutral-700 hover:bg-black/10"
                    }`}
                  >
                    {range === "24h" ? "24H" : range === "7d" ? "7 Days" : "30 Days"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[680px]">
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full">
                {[2.4, 2.0, 1.6, 1.2].map((tick) => {
                  const ratio = (tick - CHART_MIN) / (CHART_MAX - CHART_MIN);
                  const y = CHART_HEIGHT - CHART_PADDING - ratio * (CHART_HEIGHT - CHART_PADDING * 2);
                  return (
                    <line
                      key={tick}
                      x1={CHART_PADDING}
                      x2={CHART_WIDTH - CHART_PADDING}
                      y1={y}
                      y2={y}
                      stroke="rgba(15,23,42,0.12)"
                      strokeDasharray="4 6"
                    />
                  );
                })}

                <line
                  x1={CHART_PADDING}
                  x2={CHART_WIDTH - CHART_PADDING}
                  y1={thresholdY}
                  y2={thresholdY}
                  stroke="rgba(220,38,38,0.7)"
                  strokeDasharray="6 6"
                />

                <motion.path
                  d={areaPath}
                  animate={{ d: areaPath }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  fill="rgba(16,185,129,0.12)"
                />
                <motion.path
                  d={linePath}
                  animate={{ d: linePath }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="3"
                />

                {chartPoints.map((point, index) => (
                  <motion.circle
                    key={`point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    animate={{ cx: point.x, cy: point.y }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    r="5"
                    fill="#111111"
                  />
                ))}
              </svg>

              <div
                className="mt-2 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${selectedHealthSeries.length}, minmax(0, 1fr))` }}
              >
                {selectedHealthSeries.map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="font-manrope text-xs text-neutral-600">{item.label}</p>
                    <p className="font-syne text-sm font-bold text-neutral-950">{item.value.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}





