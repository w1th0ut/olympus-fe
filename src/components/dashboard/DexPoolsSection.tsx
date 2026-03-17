"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, type Address } from "viem";
import {
  ArrowDown,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { aaveAbi, erc20Abi, uniswapAbi } from "@/lib/olympus-abi";
import { olympusAddresses, toPoolKey } from "@/lib/olympus";
import { resolveOlympusSwapPoolMetrics } from "@/lib/olympusSwapPricing";
import { Skeleton } from "@/components/ui/skeleton";
import { targetChain } from "@/lib/chains";

type Timeframe = "1H" | "1D" | "1W" | "1M" | "1Y" | "ALL";
type MetricMode = "Price" | "Volume";

type PoolRow = {
  id: string;
  pair: string;
  icon0: string;
  icon1: string;
  protocol: string;
  feeTier: string;
  tvl: string;
  poolApr: string;
  rewardApr: string;
  vol1d: string;
  vol30d: string;
  volToTvl: string;
  totalApr: string;
  reserve0: string;
  reserve1: string;
  tvlValue: string;
  tvlChange: string;
  vol24hValue: string;
  vol24hChange: string;
  fees24hValue: string;
  fees24hChange: string;
  priceBase: number;
  volumeBase: number;
};

type PoolId = "weth-usdc" | "wbtc-usdc" | "dot-usdc";

const pools: PoolRow[] = [
  {
    id: "weth-usdc",
    pair: "WETH/USDC",
    icon0: "/icons/Logo-WETH.png",
    icon1: "/icons/Logo-USDC.png",
    protocol: "v4",
    feeTier: "0.3%",
    tvl: "$113.1M",
    poolApr: "22.40%",
    rewardApr: "4.80%",
    vol1d: "$24.1M",
    vol30d: "$612.3M",
    volToTvl: "0.21",
    totalApr: "27.20%",
    reserve0: "24.3K WETH",
    reserve1: "69.2M USDC",
    tvlValue: "$113.1M",
    tvlChange: "0.92%",
    vol24hValue: "$24.1M",
    vol24hChange: "6.40%",
    fees24hValue: "$72.4K",
    fees24hChange: "3.12%",
    priceBase: 2660,
    volumeBase: 1_000_000,
  },
  {
    id: "wbtc-usdc",
    pair: "WBTC/USDC",
    icon0: "/icons/Logo-WBTC.png",
    icon1: "/icons/Logo-USDC.png",
    protocol: "v4",
    feeTier: "0.3%",
    tvl: "$79.7M",
    poolApr: "18.75%",
    rewardApr: "3.10%",
    vol1d: "$14.7M",
    vol30d: "$398.6M",
    volToTvl: "0.18",
    totalApr: "21.85%",
    reserve0: "347.6 WBTC",
    reserve1: "58.4M USDC",
    tvlValue: "$79.7M",
    tvlChange: "0.53%",
    vol24hValue: "$14.7M",
    vol24hChange: "4.21%",
    fees24hValue: "$44.1K",
    fees24hChange: "2.11%",
    priceBase: 67414.74,
    volumeBase: 620_000,
  },
  {
    id: "dot-usdc",
    pair: "DOT/USDC",
    icon0: "/icons/Logo-Polkadot.png",
    icon1: "/icons/Logo-USDC.png",
    protocol: "v4",
    feeTier: "0.3%",
    tvl: "$64.3M",
    poolApr: "27.05%",
    rewardApr: "8.15%",
    vol1d: "$9.4M",
    vol30d: "$212.2M",
    volToTvl: "0.15",
    totalApr: "35.20%",
    reserve0: "2.1M DOT",
    reserve1: "33.4M USDC",
    tvlValue: "$64.3M",
    tvlChange: "1.22%",
    vol24hValue: "$9.4M",
    vol24hChange: "8.44%",
    fees24hValue: "$28.3K",
    fees24hChange: "4.09%",
    priceBase: 8.4,
    volumeBase: 390_000,
  },
];

const poolMeta: Record<string, { tokenAddress: Address; baseDecimals: number; baseSymbol: "WETH" | "WBTC" | "DOT" }> = {
  "weth-usdc": { tokenAddress: olympusAddresses.weth, baseDecimals: 18, baseSymbol: "WETH" },
  "wbtc-usdc": { tokenAddress: olympusAddresses.wbtc, baseDecimals: 8, baseSymbol: "WBTC" },
  "dot-usdc": { tokenAddress: olympusAddresses.dot, baseDecimals: 18, baseSymbol: "DOT" },
};

const timeframeButtons: Timeframe[] = ["1H", "1D", "1W", "1M", "1Y", "ALL"];
const timeframePoints: Record<Timeframe, number> = {
  "1H": 12,
  "1D": 24,
  "1W": 14,
  "1M": 20,
  "1Y": 24,
  ALL: 30,
};

function buildSeries(pool: PoolRow, timeframe: Timeframe, mode: MetricMode) {
  const length = timeframePoints[timeframe];
  const values: number[] = [];

  if (mode === "Volume") {
    for (let i = 0; i < length; i += 1) {
      const wave = Math.sin((i + pool.id.length) * 0.92) + Math.cos(i * 0.37);
      const jitter = Math.sin(i * 1.2 + pool.priceBase / 5000) * 0.32;
      const value = pool.volumeBase * (0.62 + wave * 0.2 + jitter * 0.18);
      values.push(Math.max(45_000, Number(value.toFixed(2))));
    }
    return values;
  }

  for (let i = 0; i < length; i += 1) {
    const wave = Math.sin((i + pool.id.length) * 0.55) + Math.cos(i * 0.41);
    const jitter = Math.sin(i * 1.13 + pool.priceBase / 1000) * 0.35;
    const value = pool.priceBase + pool.priceBase * 0.022 * (wave * 0.6 + jitter * 0.4);
    values.push(Math.max(pool.priceBase * 0.82, Number(value.toFixed(2))));
  }

  return values;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatFeeCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 100 ? 2 : 4,
  }).format(value);
}

function formatAxisTick(value: number, mode: MetricMode) {
  if (mode === "Volume") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatTokenAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatExecutionPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
}

function valueLabel(mode: MetricMode, timeframe: Timeframe) {
  if (mode === "Price") {
    return "Current pool price";
  }

  if (timeframe === "1H") {
    return "Past hour";
  }
  if (timeframe === "1D") {
    return "Past day";
  }
  if (timeframe === "1W") {
    return "Past week";
  }
  if (timeframe === "1M") {
    return "Past month";
  }
  if (timeframe === "1Y") {
    return "Past year";
  }

  return "All time";
}

export function DexPoolsSection() {
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [metricMode] = useState<MetricMode>("Price");
  const [isTokenReversed, setIsTokenReversed] = useState(false);
  const [sellAmountInput, setSellAmountInput] = useState("");

  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chainId = useChainId();
  const isOnTargetChain = chainId === targetChain.id;
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const { writeContractAsync, data: swapTxHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: swapTxHash });
  const isBusy = isSwitchPending || isWritePending || isConfirming;

  const selectedPool = pools.find((pool) => pool.id === selectedPoolId) ?? null;
  const activePool = selectedPool ?? pools[0];

  const { data: listPoolReads } = useReadContracts({
    contracts: pools.map((pool) => ({
      address: olympusAddresses.uniswapPool,
      abi: uniswapAbi,
      functionName: "getPoolStateByKey" as const,
      args: [toPoolKey(poolMeta[pool.id].tokenAddress, olympusAddresses.usdc)],
      chainId: targetChain.id,
    })),
    allowFailure: true,
    query: {
      refetchInterval: 10000,
    },
  });

  useEffect(() => {
    setIsTokenReversed(false);
    setSellAmountInput("");
  }, [selectedPoolId]);

  useEffect(() => {
    const poolParam = searchParams.get("pool");
    if (!poolParam) {
      return;
    }

    const exists = pools.some((pool) => pool.id === poolParam);
    if (!exists) {
      return;
    }

    setSelectedPoolId(poolParam);
    router.replace(`${pathname}?tab=pools`, { scroll: false });
  }, [pathname, router, searchParams]);

  const chartSeries = useMemo(() => {
    if (!selectedPool) {
      return [];
    }
    return buildSeries(selectedPool, timeframe, metricMode);
  }, [selectedPool, timeframe, metricMode]);

  const { chartMin, chartMax } = useMemo(() => {
    if (chartSeries.length === 0) {
      return { chartMin: 0, chartMax: 1 };
    }

    if (metricMode === "Volume") {
      const max = Math.max(...chartSeries) * 1.08;
      return { chartMin: 0, chartMax: max };
    }

    const min = Math.min(...chartSeries);
    const max = Math.max(...chartSeries);
    const pad = (max - min || 1) * 0.2;
    return { chartMin: min - pad, chartMax: max + pad };
  }, [chartSeries, metricMode]);

  const axisTicks = useMemo(() => {
    const count = 6;
    const step = (chartMax - chartMin) / (count - 1 || 1);
    return Array.from({ length: count }, (_, i) => chartMax - i * step);
  }, [chartMin, chartMax]);

  const lineChart = useMemo(() => {
    if (metricMode !== "Price" || chartSeries.length === 0) {
      return null;
    }

    const width = 900;
    const height = 280;
    const pad = 12;
    const divider = Math.max(1, chartSeries.length - 1);

    const points = chartSeries.map((value, index) => {
      const x = pad + (index * (width - pad * 2)) / divider;
      const ratio = (value - chartMin) / (chartMax - chartMin || 1);
      const y = height - pad - ratio * (height - pad * 2);
      return { x, y };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`;

    return { width, height, points, linePath, areaPath };
  }, [chartMax, chartMin, chartSeries, metricMode]);

  const listPoolMetrics = useMemo(() => {
    return Object.fromEntries(
      pools.map((pool, index) => {
        const meta = poolMeta[pool.id];
        const poolState = (listPoolReads?.[index]?.result as
          | { reserve0: bigint; reserve1: bigint }
          | undefined);
        const isBaseCurrency0 = meta.tokenAddress.toLowerCase() < olympusAddresses.usdc.toLowerCase();
        const reserveBaseRaw = isBaseCurrency0
          ? (poolState?.reserve0 ?? BigInt(0))
          : (poolState?.reserve1 ?? BigInt(0));
        const reserveUsdcRaw = isBaseCurrency0
          ? (poolState?.reserve1 ?? BigInt(0))
          : (poolState?.reserve0 ?? BigInt(0));
        const { tvlUsd, volumeUsd } = resolveOlympusSwapPoolMetrics({
          reserveBaseRaw,
          reserveQuoteRaw: reserveUsdcRaw,
          baseDecimals: meta.baseDecimals,
          poolId: pool.id as PoolId,
        });

        return [
          pool.id,
          {
            tvlUsd,
            volumeUsd,
            tvlLabel: formatCompactCurrency(tvlUsd),
            volumeLabel: formatCompactCurrency(volumeUsd),
          },
        ];
      }),
    ) as Record<string, { tvlUsd: number; volumeUsd: number; tvlLabel: string; volumeLabel: string }>;
  }, [listPoolReads]);

  const listView = !selectedPool ? (
    <div className="mt-8 rounded-3xl border border-black/15 bg-white text-neutral-950 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="px-6 py-5 font-manrope text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Pool Asset
              </th>
              <th className="px-6 py-5 font-manrope text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                24H Volume
              </th>
              <th className="px-6 py-5 font-manrope text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Total Value Locked
              </th>
              <th className="px-6 py-5" />
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => {
              const metrics = listPoolMetrics[pool.id] ?? {
                tvlLabel: pool.tvlValue,
                volumeLabel: pool.vol24hValue,
              };

              return (
              <tr key={pool.id} className="border-b border-black/10 last:border-b-0">
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center -space-x-2">
                      <img src={pool.icon0} alt="" className="h-10 w-10 rounded-full border border-black/15 bg-white" />
                      <img src={pool.icon1} alt="" className="h-10 w-10 rounded-full border border-black/15 bg-white" />
                    </div>
                    <div>
                      <p className="font-syne text-xl font-bold text-neutral-950">{pool.pair}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 font-syne text-2xl font-bold text-neutral-950">{metrics.volumeLabel}</td>
                <td className="px-6 py-6 font-syne text-2xl font-bold text-neutral-950">{metrics.tvlLabel}</td>
                <td className="px-6 py-6">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href="/dashboard?tab=earn"
                      className="inline-flex items-center justify-center rounded-xl border border-[#7ec4f4] px-4 py-2 font-manrope text-xs font-semibold uppercase tracking-[0.12em] text-[#0f5f8f] transition-colors hover:bg-[#7ec4f4]/10"
                    >
                      Join Pool
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedPoolId(pool.id)}
                      className="inline-flex items-center justify-center rounded-xl border border-[#7ec4f4] px-4 py-2 font-manrope text-xs font-semibold uppercase tracking-[0.12em] text-[#0f5f8f] transition-colors hover:bg-[#7ec4f4]/10"
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  ) : null;

  const [pairToken0, pairToken1] = activePool.pair.split(/\s*\/\s*/);
  const sellToken = isTokenReversed ? pairToken1 : pairToken0;
  const buyToken = isTokenReversed ? pairToken0 : pairToken1;
  const sellIcon = isTokenReversed ? activePool.icon1 : activePool.icon0;
  const buyIcon = isTokenReversed ? activePool.icon0 : activePool.icon1;

  const selectedPoolMeta = poolMeta[activePool.id] ?? poolMeta["weth-usdc"];
  const selectedPoolKey = toPoolKey(selectedPoolMeta.tokenAddress, olympusAddresses.usdc);

  const { data: selectedPoolReads, isLoading: isSelectedPoolLoading } = useReadContracts({
    contracts: [
      {
        address: olympusAddresses.uniswapPool,
        abi: uniswapAbi,
        functionName: "getPoolStateByKey",
        args: [selectedPoolKey],
        chainId: targetChain.id,
      },
      {
        address: olympusAddresses.aavePool,
        abi: aaveAbi,
        functionName: "assetPrices",
        args: [selectedPoolMeta.tokenAddress],
        chainId: targetChain.id,
      },
    ],
    allowFailure: true,
    query: {
      enabled: Boolean(selectedPool),
      refetchInterval: 10000,
    },
  });

  const poolState = (selectedPoolReads?.[0]?.result as
    | { reserve0: bigint; reserve1: bigint }
    | undefined);
  const oraclePriceRaw = (selectedPoolReads?.[1]?.result as bigint | undefined) ?? BigInt(0);

  const isBaseCurrency0 =
    selectedPoolMeta.tokenAddress.toLowerCase() < olympusAddresses.usdc.toLowerCase();
  const reserveBaseRaw = isBaseCurrency0
    ? (poolState?.reserve0 ?? BigInt(0))
    : (poolState?.reserve1 ?? BigInt(0));
  const reserveUsdcRaw = isBaseCurrency0
    ? (poolState?.reserve1 ?? BigInt(0))
    : (poolState?.reserve0 ?? BigInt(0));

  const oraclePrice = Number(formatUnits(oraclePriceRaw, 8));
  const {
    reserveBaseAmount: reserve0Amount,
    reserveQuoteAmount: reserve1Amount,
    poolPriceUsd,
  } = resolveOlympusSwapPoolMetrics({
    reserveBaseRaw,
    reserveQuoteRaw: reserveUsdcRaw,
    baseDecimals: selectedPoolMeta.baseDecimals,
    poolId: activePool.id as PoolId,
  });

  const dynamicPrice = poolPriceUsd > 0 ? poolPriceUsd : activePool.priceBase;
  const currentPoolPriceLabel = `1 ${pairToken0} = ${formatPrice(dynamicPrice)}`;
  const conversionRate = isTokenReversed ? 1 / dynamicPrice : dynamicPrice;

  const sellDecimals = isTokenReversed ? 6 : selectedPoolMeta.baseDecimals;
  const buyDecimals = isTokenReversed ? selectedPoolMeta.baseDecimals : 6;
  const sellTokenAddress = isTokenReversed ? olympusAddresses.usdc : selectedPoolMeta.tokenAddress;
  const buyTokenAddress = isTokenReversed ? selectedPoolMeta.tokenAddress : olympusAddresses.usdc;

  const sellAmountRaw = useMemo(() => {
    if (!sellAmountInput.trim()) {
      return BigInt(0);
    }

    try {
      return parseUnits(sellAmountInput, sellDecimals);
    } catch {
      return BigInt(0);
    }
  }, [sellAmountInput, sellDecimals]);

  const zeroForOne = sellTokenAddress.toLowerCase() === selectedPoolKey.currency0.toLowerCase();

  const { data: swapReads, isLoading: isSwapReadsLoading } = useReadContracts({
    contracts: [
      {
        address: sellTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: targetChain.id,
      },
      {
        address: buyTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: targetChain.id,
      },
      {
        address: sellTokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [
          address ?? "0x0000000000000000000000000000000000000000",
          olympusAddresses.uniswapPool,
        ],
        chainId: targetChain.id,
      },
      {
        address: olympusAddresses.uniswapPool,
        abi: uniswapAbi,
        functionName: "getSwapQuote",
        args: [selectedPoolKey, zeroForOne, sellAmountRaw],
        chainId: targetChain.id,
      },
    ],
    allowFailure: true,
    query: {
      enabled: Boolean(selectedPool),
      refetchInterval: 5000,
    },
  });

  const sellBalanceRaw = (swapReads?.[0]?.result as bigint | undefined) ?? BigInt(0);
  const buyBalanceRaw = (swapReads?.[1]?.result as bigint | undefined) ?? BigInt(0);
  const allowanceRaw = (swapReads?.[2]?.result as bigint | undefined) ?? BigInt(0);
  const quoteResult = (swapReads?.[3]?.result as readonly [bigint, bigint] | undefined) ?? [BigInt(0), BigInt(0)];
  const quoteOutRaw = quoteResult[0];
  const quoteFeeRaw = quoteResult[1];

  const parsedSellAmount = Number.parseFloat(sellAmountInput);
  const sellAmount = Number.isFinite(parsedSellAmount) && parsedSellAmount > 0 ? parsedSellAmount : 0;
  const quotedBuyAmount = Number(formatUnits(quoteOutRaw, buyDecimals));
  const buyAmount = quoteOutRaw > BigInt(0) ? quotedBuyAmount : sellAmount * conversionRate;
  const executionPrice = sellAmount > 0 && buyAmount > 0 ? buyAmount / sellAmount : 0;
  const sellUsdValue = isTokenReversed ? sellAmount : sellAmount * dynamicPrice;
  const buyUsdValue = isTokenReversed ? buyAmount * dynamicPrice : buyAmount;

  const walletSellBalance = Number(formatUnits(sellBalanceRaw, sellDecimals));
  const walletBuyBalance = Number(formatUnits(buyBalanceRaw, buyDecimals));
  const feeRatePercent = selectedPoolKey.fee / 10000;
  const feeAmount = Number(formatUnits(quoteFeeRaw, sellDecimals));
  const feeUsdValue = isTokenReversed ? feeAmount : feeAmount * dynamicPrice;

  const reserveInRaw = zeroForOne ? (poolState?.reserve0 ?? BigInt(0)) : (poolState?.reserve1 ?? BigInt(0));
  const reserveOutRaw = zeroForOne ? (poolState?.reserve1 ?? BigInt(0)) : (poolState?.reserve0 ?? BigInt(0));
  const reserveInAmount = Number(formatUnits(reserveInRaw, sellDecimals));
  const reserveOutAmount = Number(formatUnits(reserveOutRaw, buyDecimals));

  const expectedOutNoImpact =
    reserveInAmount > 0 && reserveOutAmount > 0
      ? (sellAmount - feeAmount) * (reserveOutAmount / reserveInAmount)
      : 0;

  const rawPriceImpactPercent =
    expectedOutNoImpact > 0 && buyAmount > 0
      ? ((expectedOutNoImpact - buyAmount) / expectedOutNoImpact) * 100
      : 0;

  const priceImpactPercent = Number.isFinite(rawPriceImpactPercent)
    ? Math.max(0, rawPriceImpactPercent)
    : 0;

  const priceImpactLevel = priceImpactPercent < 0.5
    ? "Low"
    : priceImpactPercent < 2
      ? "Medium"
      : "High";

  const needsApproval = sellAmountRaw > BigInt(0) && allowanceRaw < sellAmountRaw;
  const isSwapDataLoading = isSwapReadsLoading && Boolean(selectedPool);
  const hasEnoughBalance = sellAmountRaw <= sellBalanceRaw;
  const canSwap = sellAmountRaw > BigInt(0) && hasEnoughBalance;
  const actionEnabled = isConnected && !isBusy && (isOnTargetChain ? canSwap : sellAmountRaw > BigInt(0));
  const swapButtonLabel = !isConnected
    ? "Connect Wallet"
    : !isOnTargetChain
      ? "Switch to Polkadot Hub TestNet"
      : !hasEnoughBalance && sellAmountRaw > BigInt(0)
        ? "Insufficient balance"
        : needsApproval
          ? `Approve ${sellToken}`
          : isBusy
            ? "Processing..."
            : canSwap
              ? `Swap ${sellToken} to ${buyToken}`
              : "Enter an amount";

  const handleSwap = async () => {
    if (!isConnected || isBusy || sellAmountRaw === BigInt(0)) {
      return;
    }

    try {
      if (!isOnTargetChain) {
        await switchChainAsync({ chainId: targetChain.id });
        return;
      }

      if (needsApproval) {
        await writeContractAsync({
          address: sellTokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [olympusAddresses.uniswapPool, sellAmountRaw],
          chainId: targetChain.id,
        });
        return;
      }

      await writeContractAsync({
        address: olympusAddresses.uniswapPool,
        abi: uniswapAbi,
        functionName: "swap",
        args: [selectedPoolKey, zeroForOne, BigInt(0) - sellAmountRaw, BigInt(0)],
        chainId: targetChain.id,
      });
    } catch {
      // noop
    }
  };

  const totalReserveUsd = reserve0Amount * dynamicPrice + reserve1Amount;
  const reserve0ShareRaw = totalReserveUsd > 0 ? (reserve0Amount * dynamicPrice / totalReserveUsd) * 100 : 50;
  const reserve0Share = Number.isFinite(reserve0ShareRaw) ? reserve0ShareRaw : 50;
  const reserve1Share = 100 - reserve0Share;
  const reserve0BarWidth = Math.min(98, Math.max(2, reserve0Share));
  const reserve1BarWidth = 100 - reserve0BarWidth;
  const reserve0Color =
    pairToken0 === "WETH" ? "#111827" : pairToken0 === "WBTC" ? "#f7931a" : "#4f66ff";
  const reserve0Label = `${formatTokenAmount(reserve0Amount)} ${pairToken0}`;
  const reserve1Label = `${formatTokenAmount(reserve1Amount)} ${pairToken1}`;
  const dynamicTvlValue = formatCompactCurrency(totalReserveUsd);
  const dynamicVol24Value = formatCompactCurrency(Math.max(totalReserveUsd * 0.12, 0));
  const dynamicFees24Value = formatCompactCurrency(Math.max(totalReserveUsd * 0.12 * 0.003, 0));

  if (!selectedPool) {
    return listView;
  }

  return (
    <div className="mt-8 space-y-4 text-neutral-950">
      <div className="flex flex-wrap items-center gap-3 font-manrope text-sm text-neutral-600">
        <button
          type="button"
          onClick={() => setSelectedPoolId(null)}
          className="inline-flex items-center gap-2 text-neutral-700 transition-colors hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pools
        </button>
        <ChevronRight className="h-4 w-4 text-neutral-500" />
        <span className="font-syne text-lg font-bold text-neutral-950">{selectedPool.pair}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
        <article className="rounded-3xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  <img src={selectedPool.icon0} alt="" className="h-12 w-12 rounded-full border border-black/15 bg-white" />
                  <img src={selectedPool.icon1} alt="" className="h-12 w-12 rounded-full border border-black/15 bg-white" />
                </div>
                <div>
                  <h3 className="font-syne text-3xl font-bold text-neutral-950">{selectedPool.pair.replace("/", " / ")}</h3>
                  <p className="font-manrope text-sm text-neutral-500">Polkadot-native liquidity venue</p>
                </div>
              </div>

              {isSelectedPoolLoading ? (
                <>
                  <Skeleton className="mt-5 h-10 w-56" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </>
              ) : (
                <>
                  <p className="mt-5 font-syne text-4xl font-bold text-[#0f5f8f]">{currentPoolPriceLabel}</p>
                  <p className="mt-1 font-manrope text-sm text-neutral-600">{valueLabel(metricMode, timeframe)}</p>
                </>
              )}
            </div>

            <div className="inline-flex rounded-2xl border border-[#7ec4f4]/50 bg-[#eaf6ff] p-1">
              {timeframeButtons.map((item) => {
                const isActive = timeframe === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTimeframe(item)}
                    className={`rounded-xl px-3 py-2 font-manrope text-xs font-semibold transition-colors sm:text-sm ${
                      isActive ? "bg-[#0f5f8f] text-white" : "text-[#0f5f8f] hover:bg-[#7ec4f4]/20"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#7ec4f4]/40 bg-[linear-gradient(180deg,rgba(183,229,255,0.24),rgba(255,255,255,0.98))] p-5">
            <div className="relative h-[360px]">
              <div className="absolute inset-y-4 right-0 flex w-[92px] flex-col justify-between text-right">
                {axisTicks.map((tick) => (
                  <span key={tick} className="font-manrope text-xs text-[#0f5f8f]/80">
                    {formatAxisTick(tick, metricMode)}
                  </span>
                ))}
              </div>

              <div className="mr-[96px] h-full overflow-hidden rounded-[24px] border border-[#7ec4f4]/30 bg-[linear-gradient(180deg,rgba(15,95,143,0.12),rgba(255,255,255,0.6))] p-4">
                {lineChart ? (
                  <svg viewBox={`0 0 ${lineChart.width} ${lineChart.height}`} className="h-full w-full">
                    <defs>
                      <linearGradient id="olympusPoolAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(63,164,228,0.30)" />
                        <stop offset="100%" stopColor="rgba(63,164,228,0.03)" />
                      </linearGradient>
                    </defs>

                    {axisTicks.map((tick) => {
                      const ratio = (tick - chartMin) / (chartMax - chartMin || 1);
                      const y = lineChart.height - 12 - ratio * (lineChart.height - 24);
                      return (
                        <line
                          key={`grid-${tick}`}
                          x1={12}
                          y1={y}
                          x2={lineChart.width - 12}
                          y2={y}
                          stroke="rgba(15,95,143,0.14)"
                          strokeDasharray="4 8"
                        />
                      );
                    })}

                    <motion.path
                      d={lineChart.areaPath}
                      animate={{ d: lineChart.areaPath }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      fill="url(#olympusPoolAreaGradient)"
                    />
                    <motion.path
                      d={lineChart.linePath}
                      animate={{ d: lineChart.linePath }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      fill="none"
                      stroke="#8ae0ff"
                      strokeWidth="3"
                    />

                    {lineChart.points.length > 0 ? (
                      <circle
                        cx={lineChart.points[lineChart.points.length - 1].x}
                        cy={lineChart.points[lineChart.points.length - 1].y}
                        r="5"
                        fill="#8ae0ff"
                      />
                    ) : null}
                  </svg>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#7ec4f4]/30 pt-4">
              <span className="font-manrope text-sm text-neutral-500">Current spot route</span>
              {isSelectedPoolLoading ? (
                <Skeleton className="h-4 w-36" />
              ) : (
                <span className="font-manrope text-sm font-semibold text-[#0f5f8f]">
                  1 {pairToken0} = {formatExecutionPrice(dynamicPrice)} {pairToken1}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-black/10 bg-[#f8fbff] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-syne text-3xl font-bold text-neutral-950">Trade assets</h4>
                <p className="mt-1 font-manrope text-sm text-neutral-500">Swap through OlympusSwap execution routing</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-700 transition-colors hover:bg-[#edf7ff]"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-[26px] border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-manrope text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Pay with</p>
                  {isSwapDataLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <p className="font-manrope text-xs text-neutral-500">
                      Balance: {formatTokenAmount(walletSellBalance)} {sellToken}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f8fbff] px-3 py-2 font-syne text-lg font-bold text-neutral-950"
                  >
                    <img src={sellIcon} alt="" className="h-8 w-8 rounded-full border border-black/15 bg-white" />
                    {sellToken}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={sellAmountInput}
                      onChange={(event) => setSellAmountInput(event.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-right font-syne text-4xl font-bold leading-none text-neutral-950 outline-none placeholder:text-neutral-400"
                    />
                    <p className="mt-2 font-manrope text-sm text-neutral-500">{formatCompactCurrency(sellUsdValue)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsTokenReversed((previous) => !previous)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#7ec4f4]/50 bg-white text-[#0f5f8f] shadow-sm"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-[26px] border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-manrope text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">You get</p>
                  {isSwapDataLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <p className="font-manrope text-xs text-neutral-500">
                      Balance: {formatTokenAmount(walletBuyBalance)} {buyToken}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f8fbff] px-3 py-2 font-syne text-lg font-bold text-neutral-950"
                  >
                    <img src={buyIcon} alt="" className="h-8 w-8 rounded-full border border-black/15 bg-white" />
                    {buyToken}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="text-right">
                    <p className="font-syne text-4xl font-bold leading-none text-neutral-950">{formatTokenAmount(buyAmount)}</p>
                    <p className="mt-2 font-manrope text-sm text-neutral-500">{formatCompactCurrency(buyUsdValue)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[26px] border border-black/10 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-manrope text-sm text-neutral-600">Execution price</p>
                {isSwapDataLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <p className="font-manrope text-sm font-semibold text-neutral-900">
                    {sellAmountRaw > BigInt(0)
                      ? `1 ${sellToken} = ${formatExecutionPrice(executionPrice)} ${buyToken}`
                      : `1 ${sellToken} = ${formatExecutionPrice(conversionRate)} ${buyToken}`}
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-manrope text-sm text-neutral-600">Fee ({feeRatePercent.toFixed(2)}%)</p>
                {isSwapDataLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <p className="font-manrope text-sm font-semibold text-neutral-900">
                    {sellAmountRaw > BigInt(0) ? `${formatTokenAmount(feeAmount)} ${sellToken}` : "-"}
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-manrope text-sm text-neutral-600">Price impact</p>
                {isSwapDataLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <p
                    className={`font-manrope text-sm font-semibold ${
                      priceImpactLevel === "High"
                        ? "text-red-600"
                        : priceImpactLevel === "Medium"
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {sellAmountRaw > BigInt(0) ? `${priceImpactPercent.toFixed(2)}%` : "-"}
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-manrope text-sm text-neutral-600">Fee value</p>
                {isSwapDataLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <p className="font-manrope text-sm font-semibold text-neutral-900">
                    {sellAmountRaw > BigInt(0) ? formatFeeCurrency(feeUsdValue) : "-"}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleSwap();
              }}
              disabled={!actionEnabled}
              className={`mt-4 w-full rounded-2xl px-4 py-3 font-syne text-base font-bold transition-opacity ${
                actionEnabled
                  ? "bg-[linear-gradient(90deg,#0f5f8f,#3fa4e4)] text-white hover:opacity-90"
                  : "bg-black/10 text-neutral-500"
              }`}
            >
              {swapButtonLabel}
            </button>
          </div>
        </article>

        <div className="space-y-4">
          <Link
            href="/dashboard?tab=earn"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[#7ec4f4] bg-white px-4 py-3 font-syne text-base font-bold text-[#0f5f8f] transition-colors hover:bg-[#7ec4f4]/10"
          >
            Join pool from earn
          </Link>

          <article className="rounded-3xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-manrope text-sm font-semibold text-neutral-600">Pool fee tier</p>
            <p className="mt-2 font-syne text-3xl font-bold text-neutral-950">{selectedPool.feeTier}</p>
            <p className="mt-1 font-manrope text-sm text-neutral-500">OlympusSwap spot pool execution fee</p>
          </article>

          <article className="rounded-3xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h4 className="font-syne text-xl font-bold text-neutral-950">Pool stats</h4>

            <div className="mt-5 space-y-5">
              <div>
                <p className="font-manrope text-sm text-neutral-600">Pool balances</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  {isSelectedPoolLoading ? (
                    <>
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-7 w-24" />
                    </>
                  ) : (
                    <>
                      <p className="font-syne text-xl font-bold text-neutral-950">{reserve0Label}</p>
                      <p className="font-syne text-xl font-bold text-neutral-950">{reserve1Label}</p>
                    </>
                  )}
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div className="flex h-full w-full">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${reserve0BarWidth}%`, backgroundColor: reserve0Color }}
                    />
                    <div className="h-full bg-[#7ec4f4] transition-all" style={{ width: `${reserve1BarWidth}%` }} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-manrope text-xs" style={{ color: reserve0Color }}>
                    {pairToken0} {reserve0Share.toFixed(1)}%
                  </p>
                  <p className="font-manrope text-xs text-[#0f5f8f]">{pairToken1} {reserve1Share.toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <p className="font-manrope text-sm text-neutral-600">TVL</p>
                {isSelectedPoolLoading ? (
                  <Skeleton className="mt-1 h-9 w-24" />
                ) : (
                  <p className="mt-1 font-syne text-3xl font-bold text-neutral-950">{dynamicTvlValue}</p>
                )}
                <p className="font-manrope text-sm text-emerald-500">+ {selectedPool.tvlChange}</p>
              </div>

              <div>
                <p className="font-manrope text-sm text-neutral-600">24H volume</p>
                <p className="mt-1 font-syne text-3xl font-bold text-neutral-950">{dynamicVol24Value}</p>
                <p className="font-manrope text-sm text-emerald-500">+ {selectedPool.vol24hChange}</p>
              </div>

              <div>
                <p className="font-manrope text-sm text-neutral-600">24H fees</p>
                <p className="mt-1 font-syne text-3xl font-bold text-neutral-950">{dynamicFees24Value}</p>
                <p className="font-manrope text-sm text-emerald-500">+ {selectedPool.fees24hChange}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
























