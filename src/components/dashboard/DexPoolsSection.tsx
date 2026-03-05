"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";

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
    id: "link-usdc",
    pair: "LINK/USDC",
    icon0: "/icons/Logo-LINK.png",
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
    reserve0: "2.1M LINK",
    reserve1: "33.4M USDC",
    tvlValue: "$64.3M",
    tvlChange: "1.22%",
    vol24hValue: "$9.4M",
    vol24hChange: "8.44%",
    fees24hValue: "$28.3K",
    fees24hChange: "4.09%",
    priceBase: 23.4,
    volumeBase: 390_000,
  },
];

const timeframeButtons: Timeframe[] = ["1H", "1D", "1W", "1M", "1Y", "ALL"];
const metricButtons: MetricMode[] = ["Price", "Volume"];

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
  const [metricMode, setMetricMode] = useState<MetricMode>("Volume");
  const [isTokenReversed, setIsTokenReversed] = useState(false);
  const [sellAmountInput, setSellAmountInput] = useState("");

  const selectedPool = pools.find((pool) => pool.id === selectedPoolId) ?? null;

  useEffect(() => {
    setIsTokenReversed(false);
    setSellAmountInput("");
  }, [selectedPoolId]);

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

  const primaryMetricValue = useMemo(() => {
    if (!selectedPool || chartSeries.length === 0) {
      return "-";
    }

    if (metricMode === "Price") {
      const token = selectedPool.pair.split(/\s*\/\s*/)[0];
      const last = chartSeries[chartSeries.length - 1];
      return `1 ${token} = ${formatPrice(last)}`;
    }

    const totalVolume = chartSeries.reduce((sum, point) => sum + point, 0);
    return formatCompactCurrency(totalVolume);
  }, [chartSeries, metricMode, selectedPool]);

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

  if (!selectedPool) {
    return (
      <div className="mt-8 rounded-3xl border border-black/15 bg-white p-4 text-neutral-950 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)] sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">#</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">Pool</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">Protocol</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">Fee tier</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-950">TVL</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">Pool APR</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">Reward APR</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">1D vol</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">30D vol</th>
                <th className="px-3 py-3 font-manrope text-sm font-semibold text-neutral-600">1D vol/TVL</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool, index) => (
                <tr
                  key={pool.id}
                  className="cursor-pointer border-b border-black/10 transition-colors hover:bg-black/[0.03]"
                  onClick={() => setSelectedPoolId(pool.id)}
                >
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{index + 1}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center -space-x-2">
                        <img src={pool.icon0} alt="" className="h-7 w-7 rounded-full border border-black/15 bg-white" />
                        <img src={pool.icon1} alt="" className="h-7 w-7 rounded-full border border-black/15 bg-white" />
                      </div>
                      <span className="font-syne text-xl font-bold text-neutral-950">{pool.pair}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.protocol}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.feeTier}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.tvl}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.poolApr}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-600">{pool.rewardApr}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.vol1d}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.vol30d}</td>
                  <td className="px-3 py-4 font-syne text-lg font-bold text-neutral-950">{pool.volToTvl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const [pairToken0, pairToken1] = selectedPool.pair.split(/\s*\/\s*/);
  const sellToken = isTokenReversed ? pairToken1 : pairToken0;
  const buyToken = isTokenReversed ? pairToken0 : pairToken1;
  const sellIcon = isTokenReversed ? selectedPool.icon1 : selectedPool.icon0;
  const buyIcon = isTokenReversed ? selectedPool.icon0 : selectedPool.icon1;
  const conversionRate = isTokenReversed ? 1 / selectedPool.priceBase : selectedPool.priceBase;

  const parsedSellAmount = Number.parseFloat(sellAmountInput);
  const sellAmount = Number.isFinite(parsedSellAmount) && parsedSellAmount > 0 ? parsedSellAmount : 0;
  const buyAmount = sellAmount * conversionRate;
  const sellUsdValue = isTokenReversed ? sellAmount : sellAmount * selectedPool.priceBase;
  const buyUsdValue = isTokenReversed ? buyAmount * selectedPool.priceBase : buyAmount;
  const canSwap = sellAmount > 0;

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

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  <img src={selectedPool.icon0} alt="" className="h-9 w-9 rounded-full border border-black/15 bg-white" />
                  <img src={selectedPool.icon1} alt="" className="h-9 w-9 rounded-full border border-black/15 bg-white" />
                </div>
                <h3 className="font-syne text-xl font-bold text-neutral-950">{selectedPool.pair}</h3>
                <span className="rounded-md bg-black/[0.05] px-2 py-1 font-syne text-sm font-bold text-neutral-700">
                  {selectedPool.protocol}
                </span>
                <span className="rounded-md bg-black/[0.05] px-2 py-1 font-syne text-sm font-bold text-neutral-700">
                  {selectedPool.feeTier}
                </span>
              </div>

              <p className="mt-5 font-syne text-3xl font-bold text-neutral-950 sm:text-4xl">{primaryMetricValue}</p>
              <p className="mt-1 font-manrope text-sm text-neutral-600">{valueLabel(metricMode, timeframe)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-[#f6f6f6] p-4">
            <div className="relative h-[320px]">
              <div className="absolute inset-y-0 right-0 flex w-[92px] flex-col justify-between text-right">
                {axisTicks.map((tick) => (
                  <span key={tick} className="font-manrope text-xs text-neutral-500">
                    {formatAxisTick(tick, metricMode)}
                  </span>
                ))}
              </div>

              <div className="mr-[96px] h-full overflow-hidden rounded-lg border border-black/5 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.12),_transparent_70%)] p-3">
                {metricMode === "Volume" ? (
                  <div className="flex h-full items-end gap-1">
                    {chartSeries.map((point, index) => {
                      const ratio = (point - chartMin) / (chartMax - chartMin || 1);
                      const heightRatio = Math.max(ratio * 100, 3);
                      return (
                        <motion.div
                          key={`${timeframe}-${metricMode}-${index}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${heightRatio}%` }}
                          transition={{ duration: 0.35, ease: "easeInOut", delay: index * 0.01 }}
                          className="flex-1 rounded-sm bg-gradient-to-t from-fuchsia-500 to-pink-400"
                        />
                      );
                    })}
                  </div>
                ) : lineChart ? (
                  <svg viewBox={`0 0 ${lineChart.width} ${lineChart.height}`} className="h-full w-full">
                    <defs>
                      <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(236,72,153,0.32)" />
                        <stop offset="100%" stopColor="rgba(236,72,153,0.02)" />
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
                          stroke="rgba(15,23,42,0.12)"
                          strokeDasharray="3 8"
                        />
                      );
                    })}

                    <motion.path
                      d={lineChart.areaPath}
                      animate={{ d: lineChart.areaPath }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      fill="url(#priceAreaGradient)"
                    />
                    <motion.path
                      d={lineChart.linePath}
                      animate={{ d: lineChart.linePath }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="3"
                    />

                    {lineChart.points.length > 0 ? (
                      <circle
                        cx={lineChart.points[lineChart.points.length - 1].x}
                        cy={lineChart.points[lineChart.points.length - 1].y}
                        r="5"
                        fill="#ec4899"
                      />
                    ) : null}
                  </svg>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full border border-black/15 bg-black/[0.03] p-1">
                {timeframeButtons.map((item) => {
                  const isActive = timeframe === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTimeframe(item)}
                      className={`rounded-full px-3 py-1 font-syne text-xs font-bold transition-colors sm:text-sm ${
                        isActive ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-black/10"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="inline-flex rounded-full border border-black/15 bg-black/[0.03] p-1">
                {metricButtons.map((item) => {
                  const isActive = metricMode === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMetricMode(item)}
                      className={`rounded-full px-3 py-1 font-syne text-xs font-bold transition-colors sm:text-sm ${
                        isActive ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-black/10"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-[#f8f8f8] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1">
                <button
                  type="button"
                  className="rounded-full bg-neutral-950 px-3 py-1 font-syne text-xs font-bold text-white sm:text-sm"
                >
                  Swap
                </button>
                <button
                  type="button"
                  className="rounded-full px-3 py-1 font-syne text-xs font-bold text-neutral-500 sm:text-sm"
                >
                  Limit
                </button>
              </div>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-700 transition-colors hover:bg-black/[0.03]"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="font-manrope text-sm text-neutral-600">Sell</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={sellAmountInput}
                      onChange={(event) => setSellAmountInput(event.target.value)}
                      placeholder="0"
                      className="w-[160px] bg-transparent font-syne text-3xl font-bold leading-none text-neutral-950 outline-none placeholder:text-neutral-400"
                    />
                    <p className="mt-1 font-manrope text-sm text-neutral-500">{formatCompactCurrency(sellUsdValue)}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-[#f6f6f6] px-3 py-2 font-syne text-sm font-bold text-neutral-950"
                  >
                    <img src={sellIcon} alt="" className="h-6 w-6 rounded-full border border-black/15 bg-white" />
                    {sellToken}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-right font-manrope text-xs text-neutral-500">{formatTokenAmount(sellAmount)} {sellToken}</p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsTokenReversed((previous) => !previous)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-neutral-700 shadow-sm"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="font-manrope text-sm text-neutral-600">Buy</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-syne text-3xl font-bold leading-none text-neutral-950">{formatTokenAmount(buyAmount)}</p>
                    <p className="mt-1 font-manrope text-sm text-neutral-500">{formatCompactCurrency(buyUsdValue)}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-[#f6f6f6] px-3 py-2 font-syne text-sm font-bold text-neutral-950"
                  >
                    <img src={buyIcon} alt="" className="h-6 w-6 rounded-full border border-black/15 bg-white" />
                    {buyToken}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-right font-manrope text-xs text-neutral-500">{formatTokenAmount(buyAmount)} {buyToken}</p>
              </div>
            </div>

            <button
              type="button"
              disabled={!canSwap}
              className={`mt-4 w-full rounded-2xl px-4 py-3 font-syne text-base font-bold transition-opacity ${
                canSwap
                  ? "bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white hover:opacity-90"
                  : "bg-black/10 text-neutral-500"
              }`}
            >
              {canSwap ? `Swap ${sellToken} to ${buyToken}` : "Enter an amount"}
            </button>
          </div>
        </article>

        <div className="space-y-4">
          <Link
            href="/dashboard?tab=earn"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 px-4 py-3 font-syne text-base font-bold text-white transition-opacity hover:opacity-90"
          >
            Deposit on Apollos
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <article className="rounded-3xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-manrope text-sm font-semibold text-neutral-600">Total APR</p>
            <p className="mt-2 font-syne text-3xl font-bold text-neutral-950">{selectedPool.totalApr}</p>
          </article>

          <article className="rounded-3xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h4 className="font-syne text-xl font-bold text-neutral-950">Stats</h4>

            <div className="mt-5 space-y-5">
              <div>
                <p className="font-manrope text-sm text-neutral-600">Pool balances</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-syne text-xl font-bold text-neutral-950">{selectedPool.reserve0}</p>
                  <p className="font-syne text-xl font-bold text-neutral-950">{selectedPool.reserve1}</p>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div className="h-full w-[52%] bg-gradient-to-r from-fuchsia-500 to-pink-400" />
                </div>
              </div>

              <div>
                <p className="font-manrope text-sm text-neutral-600">TVL</p>
                <p className="mt-1 font-syne text-3xl font-bold text-neutral-950">{selectedPool.tvlValue}</p>
                <p className="font-manrope text-sm text-emerald-500">+ {selectedPool.tvlChange}</p>
              </div>

              <div>
                <p className="font-manrope text-sm text-neutral-600">24H volume</p>
                <p className="mt-1 font-syne text-3xl font-bold text-neutral-950">{selectedPool.vol24hValue}</p>
                <p className="font-manrope text-sm text-emerald-500">+ {selectedPool.vol24hChange}</p>
              </div>

              <div>
                <p className="font-manrope text-sm text-neutral-600">24H fees</p>
                <p className="mt-1 font-syne text-3xl font-bold text-neutral-950">{selectedPool.fees24hValue}</p>
                <p className="font-manrope text-sm text-emerald-500">+ {selectedPool.fees24hChange}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}







