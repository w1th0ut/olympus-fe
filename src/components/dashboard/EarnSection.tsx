"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { aaveAbi, vaultAbi } from "@/lib/apollos-abi";
import { apollosAddresses, vaultMarkets } from "@/lib/apollos";

const marketVisuals: Record<string, { apy: string; capacity: string; capacityValue: number }> = {
  WETH: { apy: "27.12%", capacity: "100% (FILLED)", capacityValue: 100 },
  WBTC: { apy: "36.30%", capacity: "100% (FILLED)", capacityValue: 100 },
  LINK: { apy: "27.12%", capacity: "92.25%", capacityValue: 92.25 },
};

function formatUsd(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

function formatCompactToken(value: number, symbol: string) {
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

  return `${compact} ${symbol}`;
}

export function EarnSection() {
  const contracts = vaultMarkets.flatMap((market) => [
    {
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "totalAssets" as const,
    },
    {
      address: apollosAddresses.aavePool,
      abi: aaveAbi,
      functionName: "assetPrices" as const,
      args: [market.tokenAddress],
    },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      refetchInterval: 15000,
    },
  });

  const earnMarkets = useMemo(() => {
    return vaultMarkets.map((market, index) => {
      const offset = index * 2;
      const totalAssets = (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
      const rawPrice = (data?.[offset + 1]?.result as bigint | undefined) ?? BigInt(0);

      const assetAmount = Number(formatUnits(totalAssets, market.decimals));
      const usdPrice = Number(formatUnits(rawPrice, 8));
      const usdValue = assetAmount * usdPrice;

      const visual = marketVisuals[market.symbol];

      return {
        symbol: market.symbol,
        icon: market.icon,
        apy: visual.apy,
        tvlPrimary: formatCompactToken(assetAmount, market.symbol),
        tvlSecondary: formatUsd(usdValue, 0),
        capacity: visual.capacity,
        capacityValue: visual.capacityValue,
        usdValue,
      };
    });
  }, [data]);

  const earnStats = useMemo(() => {
    const totalTvl = earnMarkets.reduce((sum, market) => sum + market.usdValue, 0);
    const highestYield = earnMarkets.reduce((max, market) => {
      const parsed = Number.parseFloat(market.apy.replace("%", ""));
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return [
      { label: "Total TVL", value: isLoading ? "Loading..." : formatUsd(totalTvl, 0) },
      { label: "Highest market yield", value: `${highestYield.toFixed(2)}%` },
      { label: "Active markets", value: String(earnMarkets.length) },
    ];
  }, [earnMarkets, isLoading]);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {earnStats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]"
          >
            <p className="font-manrope text-sm text-neutral-600">{stat.label}</p>
            <p className="mt-1 font-syne text-2xl font-bold text-neutral-950">{stat.value}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr] px-4 pb-2 text-xs font-syne font-bold text-neutral-700">
              <span>Asset</span>
              <span>APY</span>
              <span>TVL</span>
              <span>Capacity</span>
            </div>
            <div className="h-px bg-black/20" />

            {earnMarkets.map((market) => (
              <div key={market.symbol}>
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr] items-center px-4 py-4 transition-colors cursor-pointer hover:bg-black/[0.03]">
                  <div className="flex items-center gap-3">
                    <img src={market.icon} alt="" className="h-8 w-8 object-contain" />
                    <span className="font-syne text-lg font-bold text-neutral-950">{market.symbol}</span>
                  </div>

                  <span className="font-syne text-lg font-bold text-neutral-950">{market.apy}</span>

                  <div>
                    <p className="font-syne text-lg font-bold text-neutral-950">{market.tvlPrimary}</p>
                    <p className="font-manrope text-sm text-neutral-600">{market.tvlSecondary}</p>
                  </div>

                  <div>
                    <span className="font-syne text-lg font-bold text-neutral-950">{market.capacity}</span>
                    <div className="mt-2 h-2 w-full max-w-[120px] rounded-full bg-black/20">
                      <div
                        className="h-2 rounded-full bg-neutral-950"
                        style={{ width: `${market.capacityValue}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="h-px bg-black/20" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
