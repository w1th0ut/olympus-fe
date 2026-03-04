"use client";

import { ArrowUpRight, CircleHelp } from "lucide-react";

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

const creditLine = {
  used: 150000,
  total: 1000000,
  available: 850000,
  symbol: "USDC",
};

const vaultHealth = {
  healthFactor: 2.15,
  liquidationThreshold: 1.0,
  totalCollateral: "$2.10M (880 ETH)",
  totalDebt: "$150,000 (150,000 USDC)",
};

const historicalHealthFactor = [
  { label: "Day 1", value: 2.06 },
  { label: "Day 2", value: 2.11 },
  { label: "Day 3", value: 2.18 },
  { label: "Day 4", value: 2.12 },
  { label: "Day 5", value: 2.08 },
  { label: "Day 6", value: 2.2 },
  { label: "Day 7", value: 2.15 },
] as const;

const CHART_WIDTH = 760;
const CHART_HEIGHT = 230;
const CHART_PADDING = 18;
const CHART_MIN = 1.0;
const CHART_MAX = 2.4;

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
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

export function LendBorrowMonitorSection() {
  const utilizationPercent = (creditLine.used / creditLine.total) * 100;

  const hfTone =
    vaultHealth.healthFactor < 1.1
      ? "text-red-600"
      : vaultHealth.healthFactor < 1.5
        ? "text-amber-600"
        : "text-emerald-600";

  const hfStatus =
    vaultHealth.healthFactor < 1.1
      ? "Risk: Liquidation danger"
      : vaultHealth.healthFactor < 1.5
        ? "Risk: Monitor closely"
        : "Risk: Healthy";

  const chartPoints = historicalHealthFactor.map((item, index) => {
    const x =
      CHART_PADDING +
      (index * (CHART_WIDTH - CHART_PADDING * 2)) / (historicalHealthFactor.length - 1);
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
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">{supplyInfo.totalLabel}</p>
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
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">{borrowInfo.totalLabel}</p>
                  <p className="font-manrope text-sm text-neutral-600">{borrowInfo.totalSubLabel}</p>
                </div>

                <div className="border-b border-black/15 pb-3">
                  <p className="inline-flex items-center gap-1 font-manrope text-sm text-neutral-600">
                    APY, variable
                    <CircleHelp className="h-4 w-4" />
                  </p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">{borrowInfo.variableApy}</p>
                </div>

                <div>
                  <p className="font-manrope text-sm text-neutral-600">Borrow cap</p>
                  <p className="font-syne text-lg font-bold leading-tight text-neutral-950">{borrowInfo.borrowCap}</p>
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
                {vaultHealth.healthFactor.toFixed(2)}
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
              Historical Health Factor (7 Days)
            </h3>
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

                <path d={areaPath} fill="rgba(16,185,129,0.12)" />
                <path d={linePath} fill="none" stroke="#0f172a" strokeWidth="3" />

                {chartPoints.map((point) => (
                  <circle key={point.label} cx={point.x} cy={point.y} r="5" fill="#111111" />
                ))}
              </svg>

              <div className="mt-2 grid grid-cols-7">
                {historicalHealthFactor.map((item) => (
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