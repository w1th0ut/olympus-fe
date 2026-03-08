"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { aaveAbi, uniswapAbi, vaultAbi } from "@/lib/apollos-abi";
import { apollosAddresses, toPoolKey, vaultMarkets } from "@/lib/apollos";

const recentActivities = [
  {
    id: "tx-1",
    type: "Deposit",
    asset: "afWETH",
    amount: "0.62 WETH",
    value: "$1,503.40",
    detail: "Base -> Arbitrum",
    status: "Completed",
    timestamp: "2 mins ago",
  },
  {
    id: "tx-2",
    type: "Stake",
    asset: "afLINK",
    amount: "40.00 LINK",
    value: "$782.00",
    detail: "Into afLINK vault",
    status: "Completed",
    timestamp: "25 mins ago",
  },
  {
    id: "tx-3",
    type: "Bridge",
    asset: "USDC",
    amount: "1,200.00 USDC",
    value: "$1,200.00",
    detail: "CCIP route",
    status: "Pending",
    timestamp: "1 hour ago",
  },
  {
    id: "tx-4",
    type: "Withdraw",
    asset: "afWBTC",
    amount: "0.03 WBTC",
    value: "$1,308.45",
    detail: "Back to wallet",
    status: "Completed",
    timestamp: "Yesterday",
  },
] as const;

function formatCurrency(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 4) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}


export function MyBalancesSection() {
  const { address, isConnected } = useAccount();
  const activitiesPerPage = 2;
  const [activityPage, setActivityPage] = useState(1);

  const totalActivityPages = Math.max(1, Math.ceil(recentActivities.length / activitiesPerPage));
  const paginatedActivities = recentActivities.slice(
    (activityPage - 1) * activitiesPerPage,
    activityPage * activitiesPerPage,
  );

  const contracts = [
    {
      address: apollosAddresses.aavePool,
      abi: aaveAbi,
      functionName: "assetPrices" as const,
      args: [apollosAddresses.usdc],
    },
    ...vaultMarkets.flatMap((market) => [
      {
        address: market.vaultAddress,
        abi: vaultAbi,
        functionName: "balanceOf" as const,
        args: [address ?? "0x0000000000000000000000000000000000000000"],
      },
      {
        address: market.vaultAddress,
        abi: vaultAbi,
        functionName: "getSharePrice" as const,
      },
      {
        address: apollosAddresses.aavePool,
        abi: aaveAbi,
        functionName: "assetPrices" as const,
        args: [market.tokenAddress],
      },
      {
        address: apollosAddresses.aavePool,
        abi: aaveAbi,
        functionName: "getUserDebt" as const,
        args: [market.vaultAddress, apollosAddresses.usdc],
      },
      {
        address: market.vaultAddress,
        abi: vaultAbi,
        functionName: "totalAssets" as const,
      },
      {
        address: apollosAddresses.uniswapPool,
        abi: uniswapAbi,
        functionName: "getPoolStateByKey" as const,
        args: [toPoolKey(market.tokenAddress, apollosAddresses.usdc)],
      },
    ]),
  ];

  const { data } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      enabled: Boolean(address),
      refetchInterval: 15000,
    },
  });

  const activeVaultPositions = useMemo(() => {
    return vaultMarkets.map((market, index) => {
      const offset = 1 + index * 6;
      const sharesRaw = (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
      const sharePriceRaw = (data?.[offset + 1]?.result as bigint | undefined) ?? BigInt(0);
      const priceRaw = (data?.[offset + 2]?.result as bigint | undefined) ?? BigInt(0);

      const shares = Number(formatUnits(sharesRaw, 18));
      const baseAmountRaw = (sharesRaw * sharePriceRaw) / (BigInt(10) ** BigInt(18));
      const baseAmount = Number(formatUnits(baseAmountRaw, market.decimals));
      const usdPrice = Number(formatUnits(priceRaw, 8));
      const valueUsd = baseAmount * usdPrice;

      return {
        symbol: market.key,
        icon: market.afIcon,
        balanceDisplay: formatNumber(shares, 4),
        valueDisplay: formatCurrency(valueUsd, 2),
        valueUsd,
      };
    });
  }, [data]);

  const portfolioValue = activeVaultPositions.reduce((sum, position) => sum + position.valueUsd, 0);

  const usdcPriceRaw = (data?.[0]?.result as bigint | undefined) ?? BigInt(100000000);
  const usdcPrice = Number(formatUnits(usdcPriceRaw, 8));

  const portfolioHealth = useMemo(() => {
    let totalCollateralUsd = 0;
    let totalDebtUsd = 0;

    vaultMarkets.forEach((market, index) => {
      const offset = 1 + index * 6;
      const debtRaw = (data?.[offset + 3]?.result as bigint | undefined) ?? BigInt(0);
      const totalAssetsRaw = (data?.[offset + 4]?.result as bigint | undefined) ?? BigInt(0);
      const poolState = (data?.[offset + 5]?.result as
        | { reserve0: bigint; reserve1: bigint }
        | undefined);
      const oraclePriceRaw = (data?.[offset + 2]?.result as bigint | undefined) ?? BigInt(0);

      const debtUsdc = Number(formatUnits(debtRaw, 6));
      const marketNetAssetAmount = Number(formatUnits(totalAssetsRaw, market.decimals));

      const isBaseCurrency0 =
        market.tokenAddress.toLowerCase() < apollosAddresses.usdc.toLowerCase();
      const reserveBaseRaw = isBaseCurrency0
        ? (poolState?.reserve0 ?? BigInt(0))
        : (poolState?.reserve1 ?? BigInt(0));
      const reserveUsdcRaw = isBaseCurrency0
        ? (poolState?.reserve1 ?? BigInt(0))
        : (poolState?.reserve0 ?? BigInt(0));
      const reserveBaseAmount = Number(formatUnits(reserveBaseRaw, market.decimals));
      const reserveUsdcAmount = Number(formatUnits(reserveUsdcRaw, 6));
      const poolPriceUsd = reserveBaseAmount > 0 ? reserveUsdcAmount / reserveBaseAmount : 0;
      const oraclePriceUsd = Number(formatUnits(oraclePriceRaw, 8));
      const marketPriceUsd = poolPriceUsd > 0 ? poolPriceUsd : oraclePriceUsd;

      const debtUsd = debtUsdc * usdcPrice;
      const netAssetUsd = marketNetAssetAmount * marketPriceUsd;
      const collateralUsd = netAssetUsd + debtUsd;

      totalDebtUsd += debtUsd;
      totalCollateralUsd += collateralUsd;
    });

    if (totalDebtUsd <= 0) {
      return null;
    }

    return Math.max(0, totalCollateralUsd / totalDebtUsd);
  }, [data, usdcPrice]);

  const wealthSummary = {
    portfolioValue: isConnected ? formatCurrency(portfolioValue, 2) : "$0.00",
    lifetimeEarnings: "$0.00",
    averageApy: "12.5%",
    averageHealth: !isConnected ? "-" : portfolioHealth !== null ? portfolioHealth.toFixed(2) : "-",
  };

  return (
    <div className="mt-8 space-y-7">
      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Wealth Summary</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Portfolio Value</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl">
                <img src="/icons/Logo-Portfolio.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <p className="font-syne text-4xl font-bold leading-none text-neutral-950">
                  {wealthSummary.portfolioValue}
                </p>
                <p className="mt-2 font-manrope text-base text-neutral-600">Across all vaults</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Lifetime Earnings</p>
            <div className="mt-4">
              <p className="font-syne text-4xl font-bold leading-none text-emerald-500">
                {wealthSummary.lifetimeEarnings}
              </p>
              <p className="mt-2 font-manrope text-base text-neutral-600">Auto Compound</p>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Average APY & Health</p>
            <div className="mt-4 flex items-center gap-6">
              <p className="font-syne text-4xl font-bold leading-none text-neutral-950">
                {wealthSummary.averageApy}
              </p>
              <span className="h-14 w-px bg-black/25" />
              <p className="font-syne text-4xl font-bold leading-none text-emerald-500">
                {wealthSummary.averageHealth}
              </p>
            </div>
          </article>
        </div>
      </section>

      <div className="h-[3px] w-full rounded-full bg-black/30" />

      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Portfolio Details</h2>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Active Vault Positions</h3>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.7fr_0.9fr_1fr_0.8fr] px-3 pb-2">
                  <span className="font-manrope text-base text-neutral-700">Asset</span>
                  <span className="font-manrope text-base text-neutral-700">Balances</span>
                  <span className="font-manrope text-base text-neutral-700">Values</span>
                  <span className="text-right font-manrope text-base text-neutral-700">Action</span>
                </div>

                <div className="h-px bg-black/25" />

                <div className="space-y-1 py-2">
                  {activeVaultPositions.map((position) => (
                    <div
                      key={position.symbol}
                      className="grid grid-cols-[1.7fr_0.9fr_1fr_0.8fr] items-center px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={position.icon}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                        <span className="font-syne text-lg font-bold text-neutral-950">{position.symbol}</span>
                      </div>
                      <span className="font-syne text-lg font-bold text-neutral-950">{position.balanceDisplay}</span>
                      <span className="font-syne text-lg font-bold text-neutral-950">{position.valueDisplay}</span>
                      <div className="flex justify-end">
                        <Link
                          href="/dashboard?tab=earn"
                          className="rounded-md bg-neutral-800 px-4 py-1.5 font-syne text-base font-bold text-white shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors hover:bg-neutral-700"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Recent Activity</h3>
            <div className="mt-4 min-h-[330px] rounded-xl border border-dashed border-black/10 bg-black/[0.03] p-4">
              {paginatedActivities.length > 0 ? (
                <div className="space-y-3">
                  {paginatedActivities.map((activity) => {
                    const statusClass =
                      activity.status === "Completed"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700";

                    return (
                      <div key={activity.id} className="rounded-lg border border-black/10 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-syne text-base font-bold text-neutral-950">
                                {activity.type} {activity.asset}
                              </p>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 font-manrope text-xs font-semibold ${statusClass}`}
                              >
                                {activity.status}
                              </span>
                            </div>
                            <p className="mt-1 font-manrope text-xs text-neutral-600">{activity.detail}</p>
                          </div>

                          <div className="text-right">
                            <p className="font-syne text-sm font-bold text-neutral-950">{activity.amount}</p>
                            <p className="font-manrope text-xs text-neutral-500">{activity.value}</p>
                          </div>
                        </div>
                        <p className="mt-2 font-manrope text-xs text-neutral-500">{activity.timestamp}</p>
                      </div>
                    );
                  })}

                  {recentActivities.length > activitiesPerPage ? (
                    <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setActivityPage((previous) => Math.max(1, previous - 1))}
                        disabled={activityPage === 1}
                        className={`rounded-md px-3 py-1.5 font-syne text-sm font-bold transition-colors ${
                          activityPage === 1
                            ? "cursor-not-allowed bg-black/10 text-neutral-400"
                            : "bg-neutral-800 text-white hover:bg-neutral-700"
                        }`}
                      >
                        Previous
                      </button>

                      <p className="font-manrope text-xs text-neutral-600">
                        Page {activityPage} of {totalActivityPages}
                      </p>

                      <button
                        type="button"
                        onClick={() => setActivityPage((previous) => Math.min(totalActivityPages, previous + 1))}
                        disabled={activityPage === totalActivityPages}
                        className={`rounded-md px-3 py-1.5 font-syne text-sm font-bold transition-colors ${
                          activityPage === totalActivityPages
                            ? "cursor-not-allowed bg-black/10 text-neutral-400"
                            : "bg-neutral-800 text-white hover:bg-neutral-700"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="font-manrope text-sm text-neutral-500">No recent activity yet.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}



