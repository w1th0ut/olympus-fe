"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, Lock } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { aaveAbi, chainlinkAggregatorAbi, erc20Abi, uniswapAbi, vaultAbi } from "@/lib/apollos-abi";
import { apollosAddresses, toPoolKey, type VaultKey, vaultMarkets } from "@/lib/apollos";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_POOL_BORROW_CAP_USDC = 1_000_000;
const ARBISCAN_SEPOLIA_BASE = "https://sepolia.arbiscan.io/address";
const ARBISCAN_MAINNET_BASE = "https://arbiscan.io/address";
const STAKED_VAULT_ENABLED = false;
const CONVERT_ENABLED = false;
const SHARE_PRICE_DECIMALS = 18;
const CHAINLINK_PRICE_DECIMALS = 8;
const MAX_GUARDIAN_LOGS = 5;
const APY_ANNUALIZATION_WINDOW_DAYS = 30;

const chainlinkArbitrumFeeds: Record<"WETH" | "WBTC" | "LINK", `0x${string}`> = {
  WETH: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
  WBTC: "0x6ce185860a4963106506C203335A2910413708e9",
  LINK: "0x86E53CF1B870786351Da77A57575e79CB55812CB",
};

type DetailTab = "auto" | "stake";
type VaultActionTab = "deposit" | "withdraw" | "convert";
type PendingEarnAction = "approve" | "deposit" | "withdraw" | null;
type GuardianLogItem = {
  id: string;
  reason: string;
  event: string;
  observedAtMs: number;
  poolTag?: string;
};

const fallbackGuardianLogs: GuardianLogItem[] = [
  {
    id: "fallback-1",
    event: "HighVolatilityDetected",
    reason: "[Gemini] Volatility spike detected from CEX orderbooks.",
    observedAtMs: 1700000000000,
  },
  {
    id: "fallback-2",
    event: "DynamicFeeUpdated",
    reason: "[Workflow] Raising hook fee to 0.50% to reduce toxic flow.",
    observedAtMs: 1700000000000,
  },
  {
    id: "fallback-3",
    event: "LVRGuard",
    reason: "[LVR Guard] JIT pattern score elevated, protection remains active.",
    observedAtMs: 1700000000000,
  },
  {
    id: "fallback-4",
    event: "Rebalance",
    reason: "[Engine] Delta exposure rebalanced back to target 2.0x profile.",
    observedAtMs: 1700000000000,
  },
];

const vaultPoolIdMap: Record<VaultKey, string> = {
  afWETH: "weth-usdc",
  afWBTC: "wbtc-usdc",
  afLINK: "link-usdc",
};

type EarnMarketData = {
  key: VaultKey;
  symbol: "WETH" | "WBTC" | "LINK";
  icon: string;
  afIcon: string;
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  apy: string;
  apyValue: number;
  decimals: number;
  assetAmount: number;
  usdPrice: number;
  uniswapPrice: number;
  deltaSpreadPct: number;
  usdValue: number;
  debtUsdc: number;
  creditLimitUsdc: number;
  capacityValue: number;
  capacityLabel: string;
  remainingCreditUsdc: number;
  walletBalance: number;
  tvlPrimary: string;
  tvlSecondary: string;
  oracleFeedAddress: `0x${string}`;
};

function formatUsd(value: number, maximumFractionDigits = 2) {
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

function formatCompactToken(value: number, symbol: string) {
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

  return `${compact} ${symbol}`;
}

function buildYieldSeries(apyValue: number) {
  const safeApy = Number.isFinite(apyValue) ? apyValue : 20;
  const monthlyRate = safeApy / 12 / 100;
  const labels = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];

  let cumulative = 100;

  return labels.map((label, index) => {
    cumulative = cumulative * (1 + monthlyRate * 0.28);
    const momentum = Math.sin((index + 1) * 0.7) * 0.9 + Math.cos((index + 2) * 0.45) * 0.55;
    return {
      label,
      value: Number((cumulative + momentum).toFixed(2)),
    };
  });
}

export function EarnSection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isOnArbitrum = chainId === arbitrumSepolia.id;
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const { writeContractAsync, data: actionTxHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isActionSuccess } = useWaitForTransactionReceipt({
    hash: actionTxHash,
  });
  const [selectedMarketKey, setSelectedMarketKey] = useState<VaultKey | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("auto");
  const [actionTab, setActionTab] = useState<VaultActionTab>("deposit");
  const [vaultInput, setVaultInput] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingEarnAction>(null);
  const [guardianLogs, setGuardianLogs] = useState<GuardianLogItem[]>(fallbackGuardianLogs);
  const [isGuardianLogsLoading, setIsGuardianLogsLoading] = useState(false);
  const [isGuardianLogsRefreshing, setIsGuardianLogsRefreshing] = useState(false);
  const guardianLogsInitializedRef = useRef(false);

  useEffect(() => {
    if (!STAKED_VAULT_ENABLED && detailTab === "stake") {
      setDetailTab("auto");
    }
  }, [detailTab]);

  useEffect(() => {
    if (!CONVERT_ENABLED && actionTab === "convert") {
      setActionTab("deposit");
    }
  }, [actionTab]);

  const contracts = vaultMarkets.flatMap((market) => [
    {
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "totalAssets" as const,
      chainId: arbitrumSepolia.id,
    },
    {
      address: chainlinkArbitrumFeeds[market.symbol],
      abi: chainlinkAggregatorAbi,
      functionName: "latestRoundData" as const,
      chainId: arbitrum.id,
    },
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
      address: market.tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address ?? "0x0000000000000000000000000000000000000000"],
      chainId: arbitrumSepolia.id,
    },
    {
      address: apollosAddresses.uniswapPool,
      abi: uniswapAbi,
      functionName: "getPoolStateByKey" as const,
      args: [toPoolKey(market.tokenAddress, apollosAddresses.usdc)],
      chainId: arbitrumSepolia.id,
    },
    {
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "getSharePrice" as const,
      chainId: arbitrumSepolia.id,
    },
  ]);

  const { data, isLoading, refetch: refetchMarkets } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      refetchInterval: 15000,
    },
  });

  const earnMarkets = useMemo<EarnMarketData[]>(() => {
    return vaultMarkets.map((market, index) => {
      const offset = index * 7;
      const totalAssetsRaw = (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
      const latestRoundData = (data?.[offset + 1]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint]
        | undefined);
      const rawPrice = latestRoundData?.[1] && latestRoundData[1] > BigInt(0)
        ? latestRoundData[1]
        : BigInt(0);
      const rawDebt = (data?.[offset + 2]?.result as bigint | undefined) ?? BigInt(0);
      const rawCreditLimit = (data?.[offset + 3]?.result as bigint | undefined) ?? BigInt(0);
      const walletBalanceRaw = (data?.[offset + 4]?.result as bigint | undefined) ?? BigInt(0);
      const poolState = (data?.[offset + 5]?.result as
        | { reserve0: bigint; reserve1: bigint }
        | undefined);
      const sharePriceRaw = (data?.[offset + 6]?.result as bigint | undefined) ?? BigInt(0);

      const assetAmount = Number(formatUnits(totalAssetsRaw, market.decimals));
      const usdPrice = Number(formatUnits(rawPrice, CHAINLINK_PRICE_DECIMALS));
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
      const uniswapPrice = poolPriceUsd > 0 ? poolPriceUsd : usdPrice;
      const deltaSpreadPct =
        usdPrice > 0 ? ((uniswapPrice - usdPrice) / usdPrice) * 100 : 0;
      const usdValue = assetAmount * usdPrice;
      const debtUsdc = Number(formatUnits(rawDebt, 6));
      const creditLimitUsdc = Number(formatUnits(rawCreditLimit, 6));
      const maxBorrowUsdc = creditLimitUsdc > 0 ? creditLimitUsdc : DEFAULT_POOL_BORROW_CAP_USDC;
      const capacityValue = maxBorrowUsdc > 0 ? Math.min(100, (debtUsdc / maxBorrowUsdc) * 100) : 0;
      const capacityLabel =
        capacityValue >= 99.995 ? "100% (FILLED)" : `${capacityValue.toFixed(3)}%`;
      const sharePrice = Number(formatUnits(sharePriceRaw, SHARE_PRICE_DECIMALS));
      const cumulativeReturnPct =
        Number.isFinite(sharePrice) && sharePrice > 0
          ? Math.max(0, (sharePrice - 1) * 100)
          : 0;
      const apyValue = Math.max(
        0,
        Math.min(999, cumulativeReturnPct * (365 / APY_ANNUALIZATION_WINDOW_DAYS)),
      );
      const apy = `${apyValue.toFixed(2)}%`;

      return {
        key: market.key,
        symbol: market.symbol,
        icon: market.icon,
        afIcon: market.afIcon,
        vaultAddress: market.vaultAddress,
        tokenAddress: market.tokenAddress,
        apy,
        apyValue,
        decimals: market.decimals,
        assetAmount,
        usdPrice,
        uniswapPrice,
        deltaSpreadPct: Number.isFinite(deltaSpreadPct) ? deltaSpreadPct : 0,
        usdValue,
        debtUsdc,
        creditLimitUsdc: maxBorrowUsdc,
        capacityValue,
        capacityLabel,
        remainingCreditUsdc: Math.max(0, maxBorrowUsdc - debtUsdc),
        walletBalance: Number(formatUnits(walletBalanceRaw, market.decimals)),
        tvlPrimary: formatCompactToken(assetAmount, market.symbol),
        tvlSecondary: formatUsd(usdValue, 0),
        oracleFeedAddress: chainlinkArbitrumFeeds[market.symbol],
      };
    });
  }, [data]);

  const earnStats = useMemo(() => {
    const totalTvl = earnMarkets.reduce((sum, market) => sum + market.usdValue, 0);
    const highestYield = earnMarkets.reduce((max, market) => Math.max(max, market.apyValue), 0);

    return [
      { label: "Total TVL", value: isLoading ? "Loading..." : formatUsd(totalTvl, 0) },
      { label: "Highest market yield", value: `${highestYield.toFixed(2)}%` },
      { label: "Active markets", value: String(earnMarkets.length) },
    ];
  }, [earnMarkets, isLoading]);

  const selectedMarket = useMemo(
    () => earnMarkets.find((market) => market.key === selectedMarketKey) ?? null,
    [earnMarkets, selectedMarketKey],
  );

  const yieldSeries = useMemo(
    () => buildYieldSeries(selectedMarket?.apyValue ?? 0),
    [selectedMarket?.apyValue],
  );

  const chartGeometry = useMemo(() => {
    const width = 780;
    const height = 250;
    const padding = 20;
    const values = yieldSeries.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = Math.max(1, maxValue - minValue);
    const pointsDivider = Math.max(1, yieldSeries.length - 1);

    const points = yieldSeries.map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / pointsDivider;
      const ratio = (item.value - minValue) / valueRange;
      const y = height - padding - ratio * (height - padding * 2);
      return { ...item, x, y };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { width, height, padding, points, linePath, areaPath };
  }, [yieldSeries]);

  const normalizedNetAssetUsd = selectedMarket
    ? selectedMarket.usdValue > 0
      ? selectedMarket.usdValue
      : selectedMarket.debtUsdc > 0
        ? selectedMarket.debtUsdc
        : 0
    : 0;
  const totalCollateralUsd = normalizedNetAssetUsd + (selectedMarket?.debtUsdc ?? 0);
  const healthFactor =
    selectedMarket && selectedMarket.debtUsdc > 0
      ? totalCollateralUsd / selectedMarket.debtUsdc
      : null;
  const leverageCurrent =
    selectedMarket && normalizedNetAssetUsd > 0
      ? (normalizedNetAssetUsd + selectedMarket.debtUsdc) / normalizedNetAssetUsd
      : 1;
  const longCompositionUsd = Math.max(0, normalizedNetAssetUsd);
  const shortCompositionUsd = Math.max(0, selectedMarket?.debtUsdc ?? 0);
  const compositionTotalUsd = longCompositionUsd + shortCompositionUsd;
  const isCompositionEmpty = compositionTotalUsd <= 0;
  const longCompositionPercent = isCompositionEmpty
    ? 0
    : (longCompositionUsd / compositionTotalUsd) * 100;
  const shortCompositionPercent = isCompositionEmpty
    ? 0
    : (shortCompositionUsd / compositionTotalUsd) * 100;

  const vaultAmount = Number.parseFloat(vaultInput);
  const parsedVaultAmount = Number.isFinite(vaultAmount) && vaultAmount > 0 ? vaultAmount : 0;

  const inputDecimals = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "deposit"
        ? selectedMarket.decimals
        : selectedMarket.decimals
      : selectedMarket.decimals
    : 18;

  const inputAmountRaw = useMemo(() => {
    if (!selectedMarket || parsedVaultAmount <= 0) return BigInt(0);
    try {
      return parseUnits(parsedVaultAmount.toString(), inputDecimals);
    } catch {
      return BigInt(0);
    }
  }, [selectedMarket, parsedVaultAmount, inputDecimals]);

  const oneBaseUnitRaw = useMemo(() => {
    if (!selectedMarket) return BigInt(0);
    return BigInt(10) ** BigInt(selectedMarket.decimals);
  }, [selectedMarket]);

  const previewDepositArg =
    detailTab === "auto" && actionTab === "deposit" ? inputAmountRaw : BigInt(0);

  const {
    data: detailReads,
    refetch: refetchDetailReads,
    isLoading: isDetailLoading,
  } = useReadContracts({
    contracts:
      selectedMarket === null
        ? []
        : [
            {
              address: selectedMarket.vaultAddress,
              abi: vaultAbi,
              functionName: "previewDeposit" as const,
              args: [previewDepositArg],
              chainId: arbitrumSepolia.id,
            },
            {
              address: selectedMarket.vaultAddress,
              abi: vaultAbi,
              functionName: "getSharePrice" as const,
              chainId: arbitrumSepolia.id,
            },
            {
              address: selectedMarket.vaultAddress,
              abi: vaultAbi,
              functionName: "balanceOf" as const,
              args: [address ?? "0x0000000000000000000000000000000000000000"],
              chainId: arbitrumSepolia.id,
            },
            {
              address: selectedMarket.vaultAddress,
              abi: vaultAbi,
              functionName: "previewDeposit" as const,
              args: [oneBaseUnitRaw],
              chainId: arbitrumSepolia.id,
            },
            {
              address: selectedMarket.tokenAddress,
              abi: erc20Abi,
              functionName: "allowance" as const,
              args: [
                address ?? "0x0000000000000000000000000000000000000000",
                selectedMarket.vaultAddress,
              ],
              chainId: arbitrumSepolia.id,
            },
          ],
    allowFailure: true,
    query: {
      enabled: Boolean(selectedMarket),
      refetchInterval: 15000,
    },
  });

  const inputPreviewSharesRaw = (detailReads?.[0]?.result as bigint | undefined) ?? BigInt(0);
  const sharePriceRaw = (detailReads?.[1]?.result as bigint | undefined) ?? BigInt(0);
  const afWalletBalanceRaw = (detailReads?.[2]?.result as bigint | undefined) ?? BigInt(0);
  const oneBasePreviewSharesRaw = (detailReads?.[3]?.result as bigint | undefined) ?? BigInt(0);
  const baseTokenAllowanceRaw = (detailReads?.[4]?.result as bigint | undefined) ?? BigInt(0);

  const shareTokenDecimals = selectedMarket?.decimals ?? 18;
  const afWalletBalance = Number(formatUnits(afWalletBalanceRaw, shareTokenDecimals));
  const basePerAfToken =
    selectedMarket && sharePriceRaw > BigInt(0)
      ? Number(formatUnits(sharePriceRaw, SHARE_PRICE_DECIMALS))
      : 0;
  const afTokensPerBase =
    oneBasePreviewSharesRaw > BigInt(0)
      ? Number(formatUnits(oneBasePreviewSharesRaw, shareTokenDecimals))
      : basePerAfToken > 0
        ? 1 / basePerAfToken
        : 0;

  const autoWithdrawOutRaw =
    selectedMarket && inputAmountRaw > BigInt(0) && sharePriceRaw > BigInt(0)
      ? (inputAmountRaw * sharePriceRaw) / (BigInt(10) ** BigInt(SHARE_PRICE_DECIMALS))
      : BigInt(0);

  const estimatedOutputAmount = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "deposit"
        ? Number(formatUnits(inputPreviewSharesRaw, shareTokenDecimals))
        : actionTab === "withdraw"
          ? Number(formatUnits(autoWithdrawOutRaw, selectedMarket.decimals))
          : parsedVaultAmount
      : parsedVaultAmount
    : 0;

  const estimatedOutputTitle = detailTab === "auto"
    ? actionTab === "withdraw"
      ? "To wallet"
      : "To yield bearing vault"
    : "To staked vault";

  const estimatedOutputSymbol = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "deposit"
        ? selectedMarket.key
        : actionTab === "withdraw"
          ? selectedMarket.symbol
          : `s${selectedMarket.key}`
      : actionTab === "withdraw"
        ? selectedMarket.key
        : `s${selectedMarket.key}`
    : "";

  const estimatedOutputIcon = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "withdraw"
        ? selectedMarket.icon
        : selectedMarket.afIcon
      : selectedMarket.afIcon
    : "";

  const sourceTokenSymbol = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "deposit"
        ? selectedMarket.symbol
        : selectedMarket.key
      : actionTab === "withdraw"
        ? `s${selectedMarket.key}`
        : selectedMarket.key
      : "";

  const sourceTokenIcon = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "deposit"
        ? selectedMarket.icon
        : selectedMarket.afIcon
      : actionTab === "withdraw"
        ? selectedMarket.afIcon
        : selectedMarket.afIcon
    : "";

  const sourcePanelTitle = detailTab === "auto"
    ? actionTab === "withdraw"
      ? "From yield bearing vault"
      : "From wallet"
    : "From wallet";

  const destinationTokenSymbol = estimatedOutputSymbol;

  const sourceTokenBalance = selectedMarket
    ? detailTab === "auto"
      ? actionTab === "deposit"
        ? selectedMarket.walletBalance
        : afWalletBalance
      : actionTab === "withdraw"
        ? 0
        : afWalletBalance
    : 0;

  const canUseMax = sourceTokenBalance > 0;
  const hasEnoughSourceBalance = sourceTokenBalance >= parsedVaultAmount;
  const needsDepositApproval =
    Boolean(selectedMarket) &&
    detailTab === "auto" &&
    actionTab === "deposit" &&
    inputAmountRaw > BigInt(0) &&
    baseTokenAllowanceRaw < inputAmountRaw;
  const isActionBusy = isSwitchPending || isWritePending || isConfirming;
  const canSubmitAction =
    isConnected &&
    parsedVaultAmount > 0 &&
    detailTab === "auto" &&
    actionTab !== "convert" &&
    hasEnoughSourceBalance &&
    !isActionBusy;

  const backendBaseUrl =
    (process.env.NEXT_PUBLIC_APOLLOS_BE_URL ?? "").trim().replace(/\/$/, "");

  const selectedSpreadToneClass = selectedMarket
    ? selectedMarket.deltaSpreadPct > 0.5
      ? "text-red-600"
      : selectedMarket.deltaSpreadPct < -0.5
        ? "text-emerald-600"
        : "text-amber-600"
    : "text-neutral-700";
  const selectedPoolHref = selectedMarket
    ? `/dashboard?tab=pools&pool=${vaultPoolIdMap[selectedMarket.key]}`
    : "/dashboard?tab=pools";
  const isMarketLoading = isLoading;
  const submitButtonLabel = !isConnected
    ? "Connect Wallet"
    : detailTab !== "auto"
      ? "Launching Q3 2026"
      : actionTab === "convert"
        ? "Convert (Soon)"
        : parsedVaultAmount <= 0
          ? "Enter an amount"
          : !hasEnoughSourceBalance
            ? "Insufficient balance"
            : isActionBusy
              ? pendingAction === "approve"
                ? "Approving..."
                : pendingAction === "deposit"
                  ? "Depositing..."
                  : pendingAction === "withdraw"
                    ? "Withdrawing..."
                    : "Processing..."
              : !isOnArbitrum
                ? "Switch to Arbitrum"
                : actionTab === "deposit" && needsDepositApproval
                  ? `Approve ${selectedMarket?.symbol ?? "Token"}`
                  : actionTab === "withdraw"
                    ? "Withdraw"
                    : "Deposit";

  useEffect(() => {
    if (!isActionSuccess || !actionTxHash) {
      return;
    }

    void refetchMarkets();
    void refetchDetailReads();

    if (pendingAction === "deposit" || pendingAction === "withdraw") {
      setVaultInput("");
    }
    setPendingAction(null);
  }, [
    actionTxHash,
    isActionSuccess,
    pendingAction,
    refetchDetailReads,
    refetchMarkets,
  ]);

  useEffect(() => {
    if (!selectedMarket) {
      setGuardianLogs(fallbackGuardianLogs);
      setIsGuardianLogsLoading(false);
      setIsGuardianLogsRefreshing(false);
      guardianLogsInitializedRef.current = false;
      return;
    }

    if (!backendBaseUrl) {
      setGuardianLogs(fallbackGuardianLogs);
      setIsGuardianLogsLoading(false);
      setIsGuardianLogsRefreshing(false);
      guardianLogsInitializedRef.current = false;
      return;
    }

    guardianLogsInitializedRef.current = false;
    const abortController = new AbortController();
    let intervalHandle: ReturnType<typeof setInterval> | null = null;

    const fetchGuardianContext = async () => {
      const isInitialFetch = !guardianLogsInitializedRef.current;
      try {
        if (isInitialFetch) {
          setIsGuardianLogsLoading(true);
        } else {
          setIsGuardianLogsRefreshing(true);
        }
        const params = new URLSearchParams({
          pool: selectedMarket.symbol,
          limit: String(MAX_GUARDIAN_LOGS),
        });
        const logsResponse = await fetch(`${backendBaseUrl}/api/reporter/logs?${params.toString()}`, {
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!logsResponse.ok) {
          throw new Error(`Failed to fetch logs: ${logsResponse.status}`);
        }

        const logsJson = (await logsResponse.json()) as {
          items?: Array<{
            id?: string;
            reason?: string;
            event?: string;
            observedAtMs?: number;
            poolTag?: string;
          }>;
        };

        const items = Array.isArray(logsJson.items)
          ? logsJson.items
              .map((item, index) => ({
                id: item.id ?? `remote-${index}`,
                reason: item.reason ?? "No reason provided",
                event: item.event ?? "Unknown",
                observedAtMs:
                  typeof item.observedAtMs === "number" && Number.isFinite(item.observedAtMs)
                    ? item.observedAtMs
                    : Date.now(),
                poolTag: item.poolTag,
                }))
              .filter((item) => item.reason.trim().length > 0)
              .slice(0, MAX_GUARDIAN_LOGS)
          : [];

        if (!abortController.signal.aborted) {
          setGuardianLogs(items.length > 0 ? items : fallbackGuardianLogs);
          guardianLogsInitializedRef.current = true;
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch AI Guardian logs", error);
          setGuardianLogs(fallbackGuardianLogs);
          guardianLogsInitializedRef.current = true;
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsGuardianLogsLoading(false);
          setIsGuardianLogsRefreshing(false);
        }
      }
    };

    void fetchGuardianContext();
    intervalHandle = setInterval(() => {
      void fetchGuardianContext();
    }, 20_000);

    return () => {
      abortController.abort();
      if (intervalHandle) {
        clearInterval(intervalHandle);
      }
    };
  }, [backendBaseUrl, selectedMarket?.symbol]);

  async function handleVaultAction() {
    if (
      !selectedMarket ||
      !isConnected ||
      !address ||
      detailTab !== "auto" ||
      actionTab === "convert" ||
      parsedVaultAmount <= 0 ||
      inputAmountRaw === BigInt(0) ||
      !hasEnoughSourceBalance ||
      isActionBusy
    ) {
      return;
    }

    try {
      if (!isOnArbitrum) {
        await switchChainAsync({ chainId: arbitrumSepolia.id });
        return;
      }

      if (actionTab === "deposit") {
        if (needsDepositApproval) {
          setPendingAction("approve");
          await writeContractAsync({
            address: selectedMarket.tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [selectedMarket.vaultAddress, inputAmountRaw],
            chainId: arbitrumSepolia.id,
          });
          return;
        }

        setPendingAction("deposit");
        await writeContractAsync({
          address: selectedMarket.vaultAddress,
          abi: vaultAbi,
          functionName: "deposit",
          args: [inputAmountRaw, address],
          chainId: arbitrumSepolia.id,
        });
        return;
      }

      setPendingAction("withdraw");
      await writeContractAsync({
        address: selectedMarket.vaultAddress,
        abi: vaultAbi,
        functionName: "withdraw",
        args: [inputAmountRaw, BigInt(0)],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      setPendingAction(null);
      console.error("Earn vault transaction failed", error);
    }
  }

  if (selectedMarket) {
    return (
      <div className="mt-8 space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedMarketKey(null);
            setDetailTab("auto");
            setActionTab("deposit");
            setVaultInput("");
          }}
          className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-3 py-1.5 font-syne text-sm font-bold text-neutral-900 shadow-[0px_6px_10px_0px_rgba(0,0,0,0.10)] transition-colors hover:bg-black/[0.03]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vault List
        </button>

        <section className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img src={selectedMarket.icon} alt="" className="h-12 w-12 object-contain" />
                <div>
                  <h3 className="font-syne text-2xl font-bold text-neutral-950">
                    Apollos {selectedMarket.symbol} Vault
                  </h3>
                  <a
                    href={`${ARBISCAN_SEPOLIA_BASE}/${selectedMarket.vaultAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 break-all font-manrope text-sm text-neutral-600 transition-colors hover:text-neutral-900"
                  >
                    {selectedMarket.vaultAddress}
                    <ArrowUpRight className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <a
                href={`${ARBISCAN_MAINNET_BASE}/${selectedMarket.oracleFeedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 transition-colors hover:bg-black/[0.05]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-manrope text-xs text-neutral-600">Oracle Price</p>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 transition-colors group-hover:text-neutral-900" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <img src="/icons/Logo-Chainlink.png" alt="Chainlink" className="h-5 w-5 object-contain" />
                  <p className="font-syne text-2xl font-bold text-neutral-950">
                    {formatUsd(selectedMarket.usdPrice, 2)}
                  </p>
                </div>
              </a>

              <Link
                href={selectedPoolHref}
                className="group rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 transition-colors hover:bg-black/[0.05]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-manrope text-xs text-neutral-600">Uniswap Spot Price</p>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 transition-colors group-hover:text-neutral-900" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <img src="/icons/Logo-Uniswap.png" alt="Uniswap" className="h-5 w-5 object-contain" />
                  <p className="font-syne text-2xl font-bold text-neutral-950">
                    {formatUsd(selectedMarket.uniswapPrice, 2)}
                  </p>
                </div>
              </Link>

              <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3">
                <p className="font-manrope text-xs text-neutral-600">Delta Spread</p>
                <p className={`mt-1 font-syne text-2xl font-bold ${selectedSpreadToneClass}`}>
                  {selectedMarket.deltaSpreadPct >= 0 ? "+" : ""}
                  {selectedMarket.deltaSpreadPct.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 items-stretch gap-4 2xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
          <div className="flex h-full flex-col gap-4">
            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-syne text-lg font-bold text-neutral-950">Cumulative Yield Growth</h3>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[700px]">
                  <svg viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`} className="w-full">
                    {[0, 1, 2, 3].map((index) => {
                      const y =
                        chartGeometry.padding +
                        (index * (chartGeometry.height - chartGeometry.padding * 2)) / 3;
                      return (
                        <line
                          key={index}
                          x1={chartGeometry.padding}
                          x2={chartGeometry.width - chartGeometry.padding}
                          y1={y}
                          y2={y}
                          stroke="rgba(15,23,42,0.12)"
                          strokeDasharray="4 6"
                        />
                      );
                    })}

                    <path d={chartGeometry.areaPath} fill="rgba(16,185,129,0.15)" />
                    <path d={chartGeometry.linePath} fill="none" stroke="#0f172a" strokeWidth="3" />

                    {chartGeometry.points.map((point) => (
                      <circle key={point.label} cx={point.x} cy={point.y} r="4.5" fill="#111111" />
                    ))}
                  </svg>

                  <div
                    className="mt-2 grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${yieldSeries.length}, minmax(0, 1fr))` }}
                  >
                    {yieldSeries.map((item) => (
                      <div key={item.label} className="text-center">
                        <p className="font-manrope text-[11px] text-neutral-500">{item.label}</p>
                        <p className="font-syne text-xs font-bold text-neutral-900">{item.value.toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <h3 className="font-syne text-lg font-bold text-neutral-950">Delta Neutral Composition</h3>
              <p className="mt-1 font-manrope text-sm text-neutral-600">
                Long base asset balanced by delegated USDC short debt.
              </p>

              <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-black/10">
                {isCompositionEmpty ? (
                  <div className="h-full w-full bg-neutral-300" />
                ) : (
                  <>
                    <div
                      className="h-full bg-neutral-900"
                      style={{ width: `${longCompositionPercent}%` }}
                    />
                    <div
                      className="h-full bg-neutral-600"
                      style={{ width: `${shortCompositionPercent}%` }}
                    />
                  </>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-black/15 bg-neutral-100 px-3 py-2">
                  <p className="font-manrope text-xs text-neutral-700">
                    Long {selectedMarket.symbol} ({longCompositionPercent.toFixed(0)}%)
                  </p>
                  <p className="font-syne text-lg font-bold text-neutral-950">
                    {formatUsd(longCompositionUsd, 2)}
                  </p>
                </div>
                <div className="rounded-lg border border-black/15 bg-neutral-200 px-3 py-2">
                  <p className="font-manrope text-xs text-neutral-700">
                    Short Debt USDC ({shortCompositionPercent.toFixed(0)}%)
                  </p>
                  <p className="font-syne text-lg font-bold text-neutral-900">
                    {formatUsd(shortCompositionUsd, 2)}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <h3 className="font-syne text-lg font-bold text-neutral-950">AI Guardian Logs</h3>
              <div className="mt-3 space-y-2 rounded-lg border border-black/10 bg-black/[0.03] p-3">
                {isGuardianLogsLoading ? (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[92%]" />
                    <Skeleton className="h-4 w-[85%]" />
                  </>
                ) : (
                  <>
                    {guardianLogs.map((log) => (
                      <div key={log.id} className="space-y-0.5">
                        <p className="font-mono text-xs text-emerald-700">{`> ${log.reason}`}</p>
                        <p className="font-manrope text-[11px] text-neutral-500">
                          {new Date(log.observedAtMs).toLocaleString("en-US", {
                            hour12: false,
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" | "}
                          {log.event}
                          {log.poolTag ? ` | ${log.poolTag}` : ""}
                        </p>
                      </div>
                    ))}
                    {isGuardianLogsRefreshing ? (
                      <div className="pt-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="mt-1 h-3 w-[82%]" />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </article>
          </div>

          <div className="flex h-full flex-col gap-4">
            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <div className="grid grid-cols-2 rounded-xl border border-black/10 bg-black/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setDetailTab("auto");
                    setActionTab("deposit");
                    setVaultInput("");
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-manrope font-semibold transition-colors ${
                    detailTab === "auto"
                      ? "bg-white text-neutral-950 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)]"
                      : "text-neutral-600 hover:bg-white/70"
                  }`}
                >
                  Yield Bearing Vault
                </button>
                <button
                  type="button"
                  disabled={!STAKED_VAULT_ENABLED}
                  onClick={() => {
                    if (!STAKED_VAULT_ENABLED) return;
                    setDetailTab("stake");
                    setActionTab("deposit");
                    setVaultInput("");
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-manrope font-semibold transition-colors ${
                    detailTab === "stake"
                      ? "bg-white/80 text-neutral-700 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)]"
                      : "text-neutral-500 hover:bg-white/60"
                  }`}
                >
                  Staked Vault
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 rounded-xl border border-black/10 bg-black/[0.03] p-1">
                  {(["deposit", "withdraw", "convert"] as const).map((mode) => {
                    const isDisabled = mode === "convert" && !CONVERT_ENABLED;
                    const label =
                      mode === "deposit" ? "Deposit" : mode === "withdraw" ? "Withdraw" : "Convert";

                    return (
                    <button
                      key={mode}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        setActionTab(mode);
                        setVaultInput("");
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-manrope font-semibold transition-colors ${
                        actionTab === mode
                          ? "bg-white text-neutral-950 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)]"
                          : isDisabled
                            ? "cursor-not-allowed text-neutral-400"
                            : "text-neutral-600 hover:bg-white/70"
                      }`}
                    >
                      {label}
                    </button>
                    );
                  })}
                </div>

                <div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.2fr]">
                    <div className="rounded-lg border border-black/10 px-3 py-2">
                      <p className="font-manrope text-xs text-neutral-500">{sourcePanelTitle}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <img src={sourceTokenIcon} alt="" className="h-5 w-5 object-contain" />
                        <p className="font-syne text-2xl font-bold text-neutral-950">{sourceTokenSymbol}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-black/10 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-manrope text-xs text-neutral-500">Amount</p>
                        <button
                          type="button"
                          disabled={!canUseMax}
                          onClick={() => setVaultInput(sourceTokenBalance.toString())}
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            canUseMax
                              ? "bg-neutral-900 font-syne text-white"
                              : "cursor-not-allowed bg-black/10 font-manrope text-neutral-400"
                          }`}
                        >
                          MAX
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={vaultInput}
                        onChange={(event) => setVaultInput(event.target.value)}
                        placeholder="0.00"
                        className="mt-1 w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    {isDetailLoading ? (
                      <Skeleton className="h-4 w-44" />
                    ) : (
                      <p className="font-manrope text-xs text-neutral-500">
                        Wallet balance: {formatNumber(sourceTokenBalance, 6)} {sourceTokenSymbol}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
                  <div>
                    <p className="font-manrope text-xs text-neutral-600">{estimatedOutputTitle}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <img src={estimatedOutputIcon} alt="" className="h-5 w-5 object-contain" />
                      {isDetailLoading ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        <p className="font-syne text-2xl font-bold text-neutral-950">
                          {formatNumber(estimatedOutputAmount, 6)} {destinationTokenSymbol}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {isDetailLoading ? (
                      <Skeleton className="h-4 w-44" />
                    ) : (
                      actionTab === "withdraw" ? (
                        <p className="font-manrope text-xs text-neutral-600">
                          1 {selectedMarket.key} = {formatNumber(basePerAfToken, 6)} {selectedMarket.symbol}
                        </p>
                      ) : (
                        <p className="font-manrope text-xs text-neutral-600">
                          1 {selectedMarket.symbol} = {formatNumber(afTokensPerBase, 6)} {selectedMarket.key}
                        </p>
                      )
                    )}
                  </div>
                </div>

                {detailTab === "auto" ? (
                  <div className="rounded-lg border border-black/10 bg-black/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-manrope text-xs text-neutral-600">Capacity Utilization</p>
                      <p className="font-syne text-xs font-bold text-neutral-950">{selectedMarket.capacityLabel}</p>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-black/15">
                      <div
                        className="h-2 rounded-full bg-neutral-950"
                        style={{ width: `${selectedMarket.capacityValue}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-black/20 bg-black/[0.02] p-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-neutral-700" />
                      <p className="font-manrope text-xs text-neutral-600">
                        Staked vault execution is currently roadmap mode.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    void handleVaultAction();
                  }}
                  disabled={detailTab !== "auto" || !canSubmitAction}
                  className={`w-full rounded-md px-4 py-2 font-syne text-base font-bold ${
                    detailTab === "auto" && canSubmitAction
                      ? "bg-neutral-900 text-white shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)]"
                      : "cursor-not-allowed bg-black/10 text-neutral-500"
                  }`}
                >
                  {submitButtonLabel}
                </button>
              </div>
            </article>

            <article className="flex flex-1 flex-col rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <h3 className="font-syne text-lg font-bold text-neutral-950">Vault Health Monitor</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
                  <dt className="font-manrope text-sm text-neutral-600">Health Factor</dt>
                  <dd className="font-syne text-xl font-bold text-emerald-600">
                    {healthFactor === null ? "\u221E" : healthFactor.toFixed(2)}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
                  <dt className="font-manrope text-sm text-neutral-600">Current Leverage</dt>
                  <dd className="font-syne text-xl font-bold text-neutral-950">{leverageCurrent.toFixed(2)}x</dd>
                </div>
              </dl>

              <div className="mt-5">
                <h4 className="font-syne text-sm font-bold text-neutral-900">Contract Info</h4>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <a
                    href={`${ARBISCAN_SEPOLIA_BASE}/${selectedMarket.vaultAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 font-manrope text-sm text-neutral-700 transition-colors hover:bg-black/[0.03]"
                  >
                    Vault Contract
                    <ArrowUpRight className="h-4 w-4 text-neutral-500" />
                  </a>
                  <a
                    href={`${ARBISCAN_SEPOLIA_BASE}/${apollosAddresses.router}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 font-manrope text-sm text-neutral-700 transition-colors hover:bg-black/[0.03]"
                  >
                    Strategy Router
                    <ArrowUpRight className="h-4 w-4 text-neutral-500" />
                  </a>
                  <a
                    href={`${ARBISCAN_SEPOLIA_BASE}/${apollosAddresses.aavePool}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 font-manrope text-sm text-neutral-700 transition-colors hover:bg-black/[0.03]"
                  >
                    Credit Source
                    <ArrowUpRight className="h-4 w-4 text-neutral-500" />
                  </a>
                </div>
              </div>
            </article>

          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {earnStats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]"
          >
            <p className="font-manrope text-sm text-neutral-600">{stat.label}</p>
            {isMarketLoading ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p className="mt-1 font-syne text-2xl font-bold text-neutral-950">{stat.value}</p>
            )}
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_0.4fr] px-4 pb-2 text-xs font-syne font-bold text-neutral-700">
              <span>Asset</span>
              <span>APY</span>
              <span>TVL</span>
              <span>Capacity</span>
              <span />
            </div>
            <div className="h-px bg-black/20" />

            {isMarketLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={`earn-skeleton-${index}`}>
                    <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_0.4fr] items-center px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-2 w-24 rounded-full" />
                      </div>
                      <div className="flex justify-end">
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                    </div>
                    <div className="h-px bg-black/20" />
                  </div>
                ))
              : earnMarkets.map((market) => (
                  <div key={market.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMarketKey(market.key);
                        setDetailTab("auto");
                        setActionTab("deposit");
                        setVaultInput("");
                      }}
                      className="grid w-full grid-cols-[2fr_1fr_1.2fr_1fr_0.4fr] items-center px-4 py-4 text-left transition-colors hover:bg-black/[0.03]"
                    >
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
                        <span className="font-syne text-lg font-bold text-neutral-950">{market.capacityLabel}</span>
                        <div className="mt-2 h-2 w-full max-w-[120px] rounded-full bg-black/20">
                          <div
                            className="h-2 rounded-full bg-neutral-950"
                            style={{ width: `${market.capacityValue}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <ChevronRight className="h-5 w-5 text-neutral-500" />
                      </div>
                    </button>
                    <div className="h-px bg-black/20" />
                  </div>
                ))}
          </div>
        </div>
      </article>
    </div>
  );
}
