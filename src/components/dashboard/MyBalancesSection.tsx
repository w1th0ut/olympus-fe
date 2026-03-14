"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Droplets } from "lucide-react";
import { formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { aaveAbi, erc20Abi, mockTokenAbi, uniswapAbi, vaultAbi } from "@/lib/apollos-abi";
import { apollosAddresses, toPoolKey, vaultMarkets } from "@/lib/apollos";
import { Skeleton } from "@/components/ui/skeleton";

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

function formatCooldown(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const SHARE_PRICE_DECIMALS = 18;

const walletAssets = [
  {
    symbol: "WETH",
    icon: "/icons/Logo-WETH.png",
    address: apollosAddresses.weth,
    decimals: 18,
    faucetAmount: BigInt("10000000000000000"),
    faucetLabel: "0.01",
  },
  {
    symbol: "WBTC",
    icon: "/icons/Logo-WBTC.png",
    address: apollosAddresses.wbtc,
    decimals: 8,
    faucetAmount: BigInt(50000),
    faucetLabel: "0.0005",
  },
  {
    symbol: "LINK",
    icon: "/icons/Logo-LINK.png",
    address: apollosAddresses.link,
    decimals: 18,
    faucetAmount: BigInt("2000000000000000000"),
    faucetLabel: "2",
  },
  {
    symbol: "USDC",
    icon: "/icons/Logo-USDC.png",
    address: apollosAddresses.usdc,
    decimals: 6,
    faucetAmount: BigInt(20000000),
    faucetLabel: "20",
  },
] as const;

type WalletAsset = (typeof walletAssets)[number];
type WalletAssetSymbol = WalletAsset["symbol"];

export function MyBalancesSection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isOnArbitrumSepolia = chainId === arbitrumSepolia.id;
  const activitiesPerPage = 2;
  const [activityPage, setActivityPage] = useState(1);
  const [activeFaucetSymbol, setActiveFaucetSymbol] = useState<WalletAssetSymbol | null>(null);

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
        args: [address ?? ZERO_ADDRESS],
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

  const { data, isLoading: isPortfolioLoading } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      enabled: true,
      refetchInterval: 15000,
    },
  });

  const {
    data: walletBalancesData,
    refetch: refetchWalletBalances,
    isLoading: isWalletBalancesLoading,
  } = useReadContracts({
    contracts: walletAssets.map((asset) => ({
      address: asset.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address ?? ZERO_ADDRESS],
    })),
    allowFailure: true,
    query: {
      enabled: Boolean(address),
      refetchInterval: 15000,
    },
  });

  const {
    data: faucetStatusData,
    refetch: refetchFaucetStatus,
    isLoading: isFaucetStatusLoading,
  } = useReadContracts({
    contracts: walletAssets.flatMap((asset) => [
      {
        address: asset.address,
        abi: mockTokenAbi,
        functionName: "canClaimFaucet" as const,
        args: [address ?? ZERO_ADDRESS],
      },
      {
        address: asset.address,
        abi: mockTokenAbi,
        functionName: "getFaucetCooldown" as const,
        args: [address ?? ZERO_ADDRESS],
      },
    ]),
    allowFailure: true,
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  const {
    writeContractAsync: writeTokenFaucet,
    data: faucetTxHash,
    isPending: isFaucetPending,
  } = useWriteContract();

  const {
    isLoading: isFaucetConfirming,
    isSuccess: isFaucetSuccess,
  } = useWaitForTransactionReceipt({
    hash: faucetTxHash,
  });

  const activeVaultPositions = useMemo(() => {
    return vaultMarkets
      .map((market, index) => {
        const offset = 1 + index * 6;
        const sharesRaw = (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
        const sharePriceRaw = (data?.[offset + 1]?.result as bigint | undefined) ?? BigInt(0);
        const priceRaw = (data?.[offset + 2]?.result as bigint | undefined) ?? BigInt(0);

        const shares = Number(formatUnits(sharesRaw, market.decimals));
        const baseAmountRaw = (sharesRaw * sharePriceRaw) / (BigInt(10) ** BigInt(SHARE_PRICE_DECIMALS));
        const baseAmount = Number(formatUnits(baseAmountRaw, market.decimals));
        const usdPrice = Number(formatUnits(priceRaw, 8));
        const valueUsd = baseAmount * usdPrice;
        const principalBaseRaw = sharesRaw;
        const earningsBaseRaw =
          baseAmountRaw > principalBaseRaw ? baseAmountRaw - principalBaseRaw : BigInt(0);
        const earningsUsd = Number(formatUnits(earningsBaseRaw, market.decimals)) * usdPrice;

        return {
          symbol: market.key,
          icon: market.afIcon,
          balanceDisplay: formatNumber(shares, 4),
          valueDisplay: formatCurrency(valueUsd, 2),
          valueUsd,
          earningsUsd,
          sharesRaw,
        };
      })
      .filter((position) => position.sharesRaw > BigInt(0))
      .map(({ sharesRaw: _sharesRaw, ...position }) => position);
  }, [data]);

  const portfolioValue = activeVaultPositions.reduce((sum, position) => sum + position.valueUsd, 0);
  const lifetimeEarningsUsd = activeVaultPositions.reduce(
    (sum, position) => sum + position.earningsUsd,
    0,
  );

  const isFaucetBusy = isFaucetPending || isFaucetConfirming;

  const walletBalances = useMemo(
    () =>
      walletAssets.map((asset, index) => {
        const raw = (walletBalancesData?.[index]?.result as bigint | undefined) ?? BigInt(0);
        const balance = Number(formatUnits(raw, asset.decimals));
        const fractionDigits = asset.symbol === "USDC" ? 2 : 4;
        const statusOffset = index * 2;
        const hasStatus = typeof (faucetStatusData?.[statusOffset]?.result as boolean | undefined) === "boolean";
        const canClaimFaucet = hasStatus
          ? ((faucetStatusData?.[statusOffset]?.result as boolean | undefined) ?? false)
          : false;
        const faucetCooldownSeconds = Number(
          (faucetStatusData?.[statusOffset + 1]?.result as bigint | undefined) ?? BigInt(0),
        );
        const isCurrentFaucet = activeFaucetSymbol === asset.symbol;
        const isFaucetDisabled =
          !isConnected ||
          !isOnArbitrumSepolia ||
          !hasStatus ||
          !canClaimFaucet ||
          (isFaucetBusy && !isCurrentFaucet);

        const faucetTooltip =
          isConnected && isOnArbitrumSepolia && hasStatus && !canClaimFaucet
            ? `Cooldown ${formatCooldown(faucetCooldownSeconds)}`
            : "";

        return {
          ...asset,
          display: isConnected ? formatNumber(balance, fractionDigits) : "--",
          canClaimFaucet,
          faucetCooldownSeconds,
          isCurrentFaucet,
          isFaucetDisabled,
          faucetTooltip,
        };
      }),
    [
      walletBalancesData,
      faucetStatusData,
      isConnected,
      isOnArbitrumSepolia,
      isFaucetBusy,
      isFaucetStatusLoading,
      activeFaucetSymbol,
    ],
  );


  async function handleTokenFaucet(asset: WalletAsset) {
    if (!isConnected || !isOnArbitrumSepolia || isFaucetBusy) return;

    const targetAsset = walletBalances.find((item) => item.symbol === asset.symbol);
    if (!targetAsset || targetAsset.isFaucetDisabled || !targetAsset.canClaimFaucet) return;

    try {
      setActiveFaucetSymbol(asset.symbol);
      await writeTokenFaucet({
        address: asset.address,
        abi: mockTokenAbi,
        functionName: "faucetRaw",
        args: [asset.faucetAmount],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      setActiveFaucetSymbol(null);
      console.error(`${asset.symbol} faucet transaction failed`, error);
    }
  }

  useEffect(() => {
    if (!isFaucetSuccess || !faucetTxHash) {
      return;
    }

    setActiveFaucetSymbol(null);
    void refetchWalletBalances();
    void refetchFaucetStatus();
  }, [
    isFaucetSuccess,
    refetchFaucetStatus,
    refetchWalletBalances,
    faucetTxHash,
  ]);

  const wealthSummary = {
    portfolioValue: isConnected ? formatCurrency(portfolioValue, 2) : "$0.00",
    lifetimeEarnings: isConnected ? formatCurrency(lifetimeEarningsUsd, 2) : "$0.00",
  };

  return (
    <div className="mt-8 space-y-7">
      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Wealth Summary</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="relative overflow-hidden rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Portfolio Value</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl">
                <img src="/icons/Logo-Portfolio.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <div>
                {isConnected && isPortfolioLoading ? (
                  <Skeleton className="h-10 w-40" />
                ) : (
                  <p className="font-syne text-4xl font-bold leading-none text-neutral-950">
                    {wealthSummary.portfolioValue}
                  </p>
                )}
                <p className="mt-2 font-manrope text-base text-neutral-600">Across all vaults</p>
              </div>
            </div>
            <img
              src="/images/Box-Token.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 h-30 w-30 select-none object-contain"
            />
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Lifetime Earnings</p>
            <div className="mt-4">
              {isConnected && isPortfolioLoading ? (
                <Skeleton className="h-10 w-28" />
              ) : (
                <p className="font-syne text-4xl font-bold leading-none text-emerald-500">
                  {wealthSummary.lifetimeEarnings}
                </p>
              )}
              <p className="mt-2 font-manrope text-base text-neutral-600">Auto Compound</p>
            </div>
            <img
              src="/images/Star-Sign.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 h-30 w-30 select-none object-contain"
            />
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Wallet Balances</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {walletBalances.map((asset) => (
                <div
                  key={asset.symbol}
                  className="rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img src={asset.icon} alt={asset.symbol} className="h-5 w-5 object-contain" />
                      <p className="font-manrope text-sm text-neutral-700">{asset.symbol}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleTokenFaucet(asset);
                      }}
                      disabled={asset.isFaucetDisabled}
                      title={asset.faucetTooltip || undefined}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                        asset.isFaucetDisabled
                          ? "cursor-not-allowed bg-black/10 text-white/60"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      }`}
                    >
                      <Droplets className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {isConnected && isWalletBalancesLoading ? (
                    <Skeleton className="mt-1 h-6 w-14" />
                  ) : (
                    <p className="mt-1 font-syne text-xl font-bold leading-none text-neutral-950">
                      {asset.display}
                    </p>
                  )}
                </div>
              ))}
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

                {isConnected && isPortfolioLoading ? (
                  <div className="space-y-2 py-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`positions-skeleton-${index}`}
                        className="grid grid-cols-[1.7fr_0.9fr_1fr_0.8fr] items-center px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-20 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeVaultPositions.length > 0 ? (
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
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center">
                    <p className="font-manrope text-base text-neutral-500">No active positions.</p>
                  </div>
                )}
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








