"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { decodeEventLog, formatUnits, parseUnits } from "viem";
import { ArrowRight, CheckCircle2, Clock3, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { aaveAbi, erc20Abi, sourceRouterAbi, uniswapAbi, vaultAbi, ccipReceiverAbi } from "@/lib/apollos-abi";
import { apollosAddresses, ccipSelectors, vaultMarkets, toPoolKey } from "@/lib/apollos";
import { arbitrumSepolia, baseSepolia } from "wagmi/chains";
import { useCCIPStatus } from "@/hooks/useCCIPStatus";
import { useBridgeState } from "@/hooks/useBridgeState";
import { Skeleton } from "@/components/ui/skeleton";

type VaultKey = "afWETH" | "afWBTC" | "afLINK";
const SHARE_PRICE_DECIMALS = 18;
const APY_ANNUALIZATION_WINDOW_DAYS = 30;

const sourceChain = {
  name: "Base",
  networkTag: "L2",
  icon: "/icons/Logo-Base.png",
  eta: "15-20 min",
  ccipLane: "BASE -> ARB",
} as const;

const vaultTargets: {
  key: VaultKey;
  subtitle: string;
  estimatePriceUsd: number;
  icon: string;
  targetBaseAsset: `0x${string}`;
}[] = [
  {
    key: "afWETH",
    subtitle: "Linearized WETH yield",
    estimatePriceUsd: 2660,
    icon: "/icons/Logo-afWETH.png",
    targetBaseAsset: apollosAddresses.weth,
  },
  {
    key: "afWBTC",
    subtitle: "Linearized WBTC yield",
    estimatePriceUsd: 67414,
    icon: "/icons/Logo-afWBTC.png",
    targetBaseAsset: apollosAddresses.wbtc,
  },
  {
    key: "afLINK",
    subtitle: "Linearized LINK yield",
    estimatePriceUsd: 23.4,
    icon: "/icons/Logo-afLINK.png",
    targetBaseAsset: apollosAddresses.link,
  },
];

const timelineSteps = [
  {
    title: "Initiate on Base",
    subtext: "Transaction sent via SourceRouter.",
  },
  {
    title: "Cross-Chain Security",
    subtext: "Waiting for CCIP Finality (~15-20 mins).",
  },
  {
    title: "Ready to Zap",
    subtext: "Assets arrived. Switch network to claim.",
  },
  {
    title: "Yield Activated",
    subtext: "Assets swapped & deposited to Vault.",
  },
] as const;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatToken(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}

export function BridgeSection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const [targetVault, setTargetVault] = useState<VaultKey>("afWETH");
  const [amountInput, setAmountInput] = useState("");
  const [isAutoZapping, setIsAutoZapping] = useState(false);
  
  // Persistent State
  const { state: bridgeState, updateState, clearState, isLoaded } = useBridgeState();
  const { messageId, step: activeStep } = bridgeState;

  // CCIP Status Hook (polls on Arbitrum)
  const { status: ccipStatus } = useCCIPStatus(messageId);

  const selectedVault =
    vaultTargets.find((item) => item.key === targetVault) ?? vaultTargets[0];
  const selectedVaultMarket =
    vaultMarkets.find((market) => market.key === targetVault) ?? vaultMarkets[0];
  const { data: vaultApyReads } = useReadContracts({
    contracts: vaultMarkets.map((market) => ({
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "getSharePrice" as const,
      chainId: arbitrumSepolia.id,
    })),
    allowFailure: true,
    query: {
      refetchInterval: 15000,
    },
  });
  const apyByVault = useMemo<Record<VaultKey, string>>(() => {
    const fallback: Record<VaultKey, string> = {
      afWETH: "0.00%",
      afWBTC: "0.00%",
      afLINK: "0.00%",
    };

    return vaultMarkets.reduce((acc, market, index) => {
      const sharePriceRaw = (vaultApyReads?.[index]?.result as bigint | undefined) ?? BigInt(0);
      const sharePrice = Number(formatUnits(sharePriceRaw, SHARE_PRICE_DECIMALS));
      const cumulativeReturnPct =
        Number.isFinite(sharePrice) && sharePrice > 0
          ? Math.max(0, (sharePrice - 1) * 100)
          : 0;
      const apyValue = Math.max(
        0,
        Math.min(999, cumulativeReturnPct * (365 / APY_ANNUALIZATION_WINDOW_DAYS)),
      );
      acc[market.key] = `${apyValue.toFixed(2)}%`;
      return acc;
    }, fallback);
  }, [vaultApyReads]);
  const selectedPoolKey = toPoolKey(selectedVault.targetBaseAsset, apollosAddresses.usdc);
  const zeroForOneUsdcToBase =
    selectedPoolKey.currency0.toLowerCase() === apollosAddresses.usdc.toLowerCase();

  const amount = Number.parseFloat(amountInput);
  const parsedAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const amountRaw = useMemo(() => {
    if (parsedAmount <= 0) return BigInt(0);
    try {
      return parseUnits(parsedAmount.toString(), 18);
    } catch {
      return BigInt(0);
    }
  }, [parsedAmount]);

  // Reads for Approval and Fees
  const {
    data: bridgeReads,
    isLoading: isBridgeReadsLoading,
    refetch: refetchBridgeReads,
  } = useReadContracts({
    contracts: [
      {
        address: apollosAddresses.sourceRouter,
        abi: sourceRouterAbi,
        functionName: "supportedChains",
        args: [ccipSelectors.arbitrumSepolia],
        chainId: baseSepolia.id,
      },
      {
        address: apollosAddresses.sourceRouter,
        abi: sourceRouterAbi,
        functionName: "supportedAssets",
        args: [apollosAddresses.baseCcipBnm],
        chainId: baseSepolia.id,
      },
      {
        address: apollosAddresses.baseCcipBnm,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
        chainId: baseSepolia.id,
      },
      {
        address: apollosAddresses.baseCcipBnm,
        abi: erc20Abi,
        functionName: "allowance",
        args: [
          address ?? "0x0000000000000000000000000000000000000000",
          apollosAddresses.sourceRouter,
        ],
        chainId: baseSepolia.id,
      },
      {
        address: apollosAddresses.sourceRouter,
        abi: sourceRouterAbi,
        functionName: "getBridgeFee",
        args: [
          ccipSelectors.arbitrumSepolia,
          apollosAddresses.baseCcipBnm,
          amountRaw,
          BigInt(0),
          selectedVault.targetBaseAsset,
        ],
        chainId: baseSepolia.id,
      },
    ],
    allowFailure: true,
    query: {
      enabled: Boolean(address),
      refetchInterval: 12000,
    },
  });

  const chainSupported = (bridgeReads?.[0]?.result as boolean | undefined) ?? false;
  const assetSupported = (bridgeReads?.[1]?.result as boolean | undefined) ?? false;
  const baseUsdcBalanceRaw = (bridgeReads?.[2]?.result as bigint | undefined) ?? BigInt(0);
  const allowanceRaw = (bridgeReads?.[3]?.result as bigint | undefined) ?? BigInt(0);
  const bridgeFeeRaw = (bridgeReads?.[4]?.result as bigint | undefined) ?? BigInt(0);

  const bridgeFeeEth = Number(formatUnits(bridgeFeeRaw, 18));
  // Est ETH Price $2600 for fee display
  const bridgeFee = bridgeFeeEth * 2600;

  // Estimate Destination Amount (1 CCIP-BnM = 10 USDC)
  const destinationUsdcEquivalentRaw = useMemo(() => {
    if (amountRaw <= BigInt(0)) return BigInt(0);
    const rawAmount = amountRaw * BigInt(10);
    return rawAmount / BigInt(1_000_000_000_000); // 18 -> 6 decimals
  }, [amountRaw]);

  const destinationUsdcEquivalent = Number(formatUnits(destinationUsdcEquivalentRaw, 6));

  // Estimate Swap & Deposit
  const { data: estimatorSwapReads, isLoading: isEstimatorSwapLoading } = useReadContracts({
    contracts: [
      {
        address: apollosAddresses.uniswapPool,
        abi: uniswapAbi,
        functionName: "getSwapQuote",
        args: [selectedPoolKey, zeroForOneUsdcToBase, destinationUsdcEquivalentRaw],
        chainId: arbitrumSepolia.id,
      },
    ],
    allowFailure: true,
    query: { enabled: destinationUsdcEquivalentRaw > BigInt(0), refetchInterval: 12000 },
  });

  const swapQuote = (estimatorSwapReads?.[0]?.result as readonly [bigint, bigint] | undefined) ?? [BigInt(0), BigInt(0)];
  const quotedBaseOutRaw = swapQuote[0];

  const { data: estimatorMintReads, isLoading: isEstimatorMintLoading } = useReadContracts({
    contracts: [
      {
        address: selectedVaultMarket.vaultAddress,
        abi: vaultAbi,
        functionName: "previewDeposit",
        args: [quotedBaseOutRaw],
        chainId: arbitrumSepolia.id,
      },
    ],
    allowFailure: true,
    query: { enabled: quotedBaseOutRaw > BigInt(0), refetchInterval: 12000 },
  });

  const estimatedSharesRaw = (estimatorMintReads?.[0]?.result as bigint | undefined) ?? BigInt(0);
  const estimatedAfTokens = useMemo(() => {
    if (estimatedSharesRaw > BigInt(0)) {
      return Number(formatUnits(estimatedSharesRaw, selectedVaultMarket.decimals));
    }
    if (!Number.isFinite(destinationUsdcEquivalent) || selectedVault.estimatePriceUsd <= 0) {
      return 0;
    }
    return destinationUsdcEquivalent / selectedVault.estimatePriceUsd;
  }, [estimatedSharesRaw, destinationUsdcEquivalent, selectedVault.estimatePriceUsd, selectedVaultMarket.decimals]);

  const isEstimatorLoading = isEstimatorSwapLoading || (quotedBaseOutRaw > BigInt(0) && isEstimatorMintLoading);
  const isBridgeDataLoading = isBridgeReadsLoading && !bridgeReads;
  const needsApproval = amountRaw > BigInt(0) && allowanceRaw < amountRaw;
  const baseCcipBnmBalance = Number(formatUnits(baseUsdcBalanceRaw, 18));
  const isOnBase = chainId === baseSepolia.id;
  const isOnArbitrum = chainId === arbitrumSepolia.id;
  const hasEnoughBalance = amountRaw > BigInt(0) && amountRaw <= baseUsdcBalanceRaw;
  const canRoute = hasEnoughBalance && chainSupported && assetSupported;

  // --- Transactions ---

  // 1. Approve
  const {
    writeContractAsync: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();
  
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    isError: isApproveError,
  } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    chainId: baseSepolia.id,
  });

  const isApproveActive =
    isApprovePending || isApproveConfirming || approveTxHash !== undefined;

  // 2. Bridge (Source)
  const {
    writeContractAsync: writeBridge,
    data: bridgeTxHash,
    isPending: isBridgePending,
    reset: resetBridge,
  } = useWriteContract();
  
  const {
    isLoading: isBridgeConfirming,
    isSuccess: isBridgeSuccess,
    data: bridgeReceipt,
  } = useWaitForTransactionReceipt({
    hash: bridgeTxHash,
    chainId: baseSepolia.id,
  });

  // 3. Execute Zap (Destination)
  const {
    writeContractAsync: writeZap,
    data: zapTxHash,
    isPending: isZapPending,
    reset: resetZap,
  } = useWriteContract();

  const { isLoading: isZapConfirming, isSuccess: isZapSuccess } = useWaitForTransactionReceipt({
    hash: zapTxHash,
    chainId: arbitrumSepolia.id,
  });

  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });

  const isRouting = activeStep >= 0;
  const isBusy = isSwitchPending || isApproveActive || isBridgePending || isBridgeConfirming || isZapPending || isZapConfirming;
  const isCompleted = (activeStep >= 3 && ccipStatus === "success") || isZapSuccess; 
  const isFailed = ccipStatus === "failed";
  const isReadyToZap = ccipStatus === "stored";
  
  // Stabilize desired chain
  const shouldUseArbitrumForClaim = isReadyToZap || isZapPending || isZapConfirming || isZapSuccess || activeStep >= 3;
  const desiredChainId = shouldUseArbitrumForClaim ? arbitrumSepolia.id : baseSepolia.id;
  
  const isOnDesiredChain = chainId === desiredChainId;
  const isWaitingForCCIP = Boolean(messageId || bridgeState.txHash || bridgeTxHash) && !isReadyToZap && !isCompleted;
  const isAwaitingAutoSwitch = isConnected && !isOnDesiredChain && !isCompleted;
  const shouldResetOnUnmountRef = useRef(false);

  // Handle Bridge Success -> Set Step 1 & Save State
  useEffect(() => {
    if (isBridgeSuccess && bridgeReceipt) {
      updateState({ step: 1, txHash: bridgeTxHash });
      setAmountInput(""); 
      try {
        const logs = bridgeReceipt.logs;
        for (const log of logs) {
          try {
            const event = decodeEventLog({
              abi: sourceRouterAbi,
              data: log.data,
              topics: log.topics,
            });
            if (event.eventName === "CrossChainBridgeInitiated") {
              const msgId = event.args.messageId;
              updateState({ messageId: msgId, timestamp: Date.now() });
              break;
            }
          } catch { continue; }
        }
      } catch (e) { console.error(e); }
    }
  }, [isBridgeSuccess, bridgeReceipt]);

  // Update Status based on CCIP Hook
  useEffect(() => {
    if (!isLoaded || !messageId) return; 
    if (ccipStatus === "pending" && activeStep < 1) updateState({ step: 1 });
    if (ccipStatus === "stored" && activeStep < 2) updateState({ step: 2 }); 
    if (ccipStatus === "success") {
      updateState({ step: 4 }); 
      setIsAutoZapping(false);
    }
  }, [ccipStatus, activeStep, isLoaded, messageId]);

  useEffect(() => {
    shouldResetOnUnmountRef.current = activeStep >= 3 || ccipStatus === "success" || isZapSuccess;
  }, [activeStep, ccipStatus, isZapSuccess]);

  useEffect(() => {
    return () => {
      if (!shouldResetOnUnmountRef.current) {
        return;
      }
      clearState();
    };
  }, [clearState]);

  useEffect(() => {
    if (!isConnected || isSwitchPending || isOnDesiredChain || isCompleted) {
      return;
    }

    void switchChainAsync({ chainId: desiredChainId }).catch(() => {
      // User can reject wallet switch request.
    });
  }, [desiredChainId, isConnected, isOnDesiredChain, isSwitchPending, switchChainAsync, isCompleted]);

  const handleRoute = async () => {
    if (!isConnected || !address || isBusy) return;
    if (!isOnBase) {
      await switchChainAsync({ chainId: baseSepolia.id });
      return;
    }
    if (!canRoute) return;

    try {
      if (needsApproval) {
        const hash = await writeApprove({
          address: apollosAddresses.baseCcipBnm,
          abi: erc20Abi,
          functionName: "approve",
          args: [apollosAddresses.sourceRouter, amountRaw],
          chainId: baseSepolia.id,
        });
        return;
      }
      
      updateState({ step: 0 }); 

      await writeBridge({
        address: apollosAddresses.sourceRouter,
        abi: sourceRouterAbi,
        functionName: "bridgeToArbitrum",
        args: [
          apollosAddresses.baseCcipBnm,
          amountRaw,
          ccipSelectors.arbitrumSepolia,
          address,
          BigInt(0), 
          selectedVault.targetBaseAsset,
        ],
        value: bridgeFeeRaw,
        chainId: baseSepolia.id,
      });
    } catch {
      updateState({ step: -1 });
    }
  };

  const handleExecuteZap = async () => {
    if (!messageId || !isConnected || !publicClient) return;
    try {
      if (!isOnArbitrum) {
        setIsAutoZapping(true);
        await switchChainAsync({ chainId: arbitrumSepolia.id });
        return;
      }

      const fees = await publicClient.estimateFeesPerGas();
      const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * BigInt(150)) / BigInt(100) : undefined;
      const bufferedMaxPriority = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * BigInt(150)) / BigInt(100) : undefined;

      const freshMinShares = BigInt(0);

      await writeZap({
        address: apollosAddresses.ccipReceiver,
        abi: ccipReceiverAbi,
        functionName: "executeZap",
        args: [messageId, freshMinShares], 
        chainId: arbitrumSepolia.id,
        maxFeePerGas: bufferedMaxFee,
        maxPriorityFeePerGas: bufferedMaxPriority,
      });
      setIsAutoZapping(false);
    } catch (e) {
      console.error(e);
      setIsAutoZapping(false);
    }
  };

  const handleClearState = async () => {
    resetApprove();
    resetBridge();
    resetZap();
    clearState();
    updateState({ step: -1, messageId: undefined, txHash: undefined });
    setAmountInput("");
    setIsAutoZapping(false);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateAllowance = async () => {
      if (isApproveSuccess) {
        // Tahan state "Approving..." selama 1.5 detik setelah sukses.
        // Ini menambal bentrok cache Wagmi dan jeda sinkronisasi RPC.
        timeoutId = setTimeout(async () => {
          await refetchBridgeReads(); // Ambil data baru dengan aman
          resetApprove(); // Reset memori tx hash
        }, 1500);
      }
    };

    updateAllowance();

    // Cleanup function untuk mencegah memory leak kalau komponen di-unmount
    return () => clearTimeout(timeoutId);
  }, [isApproveSuccess, refetchBridgeReads, resetApprove]);

  // Jaga-jaga kalau transaksi gagal di blockchain (reverted)
  useEffect(() => {
    if (isApproveError) {
      resetApprove();
    }
  }, [isApproveError]);

  // --- AUTO-ZAP EFFECT ---
  useEffect(() => {
    if (isAutoZapping && isOnArbitrum && !isZapPending && !isZapConfirming && !isCompleted) {
      void handleExecuteZap();
    }
  }, [isAutoZapping, isOnArbitrum, isZapPending, isZapConfirming, isCompleted]);

  const getButtonLabel = () => {
    if (!isConnected) return "Connect Wallet";

    if (isCompleted) {
      return "Zapping Successful!";
    }
    
    if (isReadyToZap && !isOnArbitrum) {
      return "Switch to Arbitrum to Zap";
    }

    if (isWaitingForCCIP) {
      return "Waiting for CCIP...";
    }

    if (isReadyToZap && isOnArbitrum) {
      return isZapPending || isZapConfirming ? "Executing Zap..." : "Claim & Zap Assets";
    }

    if (!isWaitingForCCIP && !isReadyToZap && !isOnBase) {
      return "Switch to Base";
    }

    if (isBusy) return "Processing...";

    if (amountRaw > BigInt(0) && needsApproval) {
      return isApproveActive ? "Approving..." : "Approve CCIP-BnM";
    }
    
    return "Bridge CCIP-BnM and Zap to Earn";
  };

  const isNetworkSwitchRequired = 
    (isReadyToZap && !isOnArbitrum) || 
    (!messageId && !bridgeState.txHash && !bridgeTxHash && !isOnBase && !isReadyToZap && !isCompleted);

  const isActionEnabled =
    isConnected &&
    !isBusy &&
    (isCompleted 
      ? false 
      : (isReadyToZap
        ? true
        : (!isOnBase ? true : !isRouting && canRoute)));

  return (
    <div className="mt-8">
      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
            Bridge Request
          </h3>

          <div className="mt-4 space-y-5">
            <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <p className="font-manrope text-sm text-neutral-600">
                Need CCIP-BnM for testing?
              </p>
              <a
                href="https://docs.chain.link/ccip/test-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-syne text-sm font-bold text-neutral-950 underline-offset-2 hover:underline"
              >
                Get CCIP test tokens (Faucet)
              </a>
            </div>
            <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <p className="font-manrope text-sm text-neutral-600">Route</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-neutral-700">
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Base
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Arbitrum
                </span>
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">
                Deposit amount (CCIP-BnM)
              </p>
              <div className="mt-2 rounded-xl border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    disabled={isRouting || isBusy}
                    placeholder="0.00"
                    className="w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-50"
                  />
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-[#f6f6f6] px-3 py-1 font-syne text-sm font-bold text-neutral-950">
                    <img
                      src="/images/ccip-bnm.webp"
                      alt="CCIP-BnM"
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    CCIP-BnM
                  </span>
                </div>
              </div>
              {isBridgeDataLoading ? (
                <Skeleton className="mt-2 h-4 w-44" />
              ) : (
                <p className="mt-2 font-manrope text-xs text-neutral-500">
                  Wallet balance: {formatToken(baseCcipBnmBalance)} CCIP-BnM
                </p>
              )}
              <p className="mt-1 font-manrope text-xs text-emerald-600">
                1 CCIP-BnM = 10 USDC
              </p>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">
                Choose destination Earn vault
              </p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {vaultTargets.map((vault) => {
                  const active = vault.key === targetVault;
                  return (
                    <button
                      key={vault.key}
                      type="button"
                      disabled={isRouting}
                      onClick={() => setTargetVault(vault.key)}
                      className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-50 ${
                        active
                          ? "border-neutral-950 bg-black/[0.04]"
                          : "border-black/10 bg-white hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={vault.icon}
                          alt=""
                          className="h-7 w-7 shrink-0 object-contain"
                        />
                        <p className="font-syne text-sm font-bold text-neutral-950">
                          {vault.key}
                        </p>
                      </div>
                      <p className="mt-2 font-manrope text-xs text-neutral-600">
                        {vault.subtitle}
                      </p>
                      <p className="mt-1 font-syne text-sm font-bold text-emerald-600">
                        {apyByVault[vault.key]} APY
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
            <p className="font-syne text-base font-bold text-neutral-950">
              Route Preview
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-black/10 bg-white p-3">
                <p className="font-manrope text-xs text-neutral-600">
                  Estimated bridge fee
                </p>
                {isBridgeDataLoading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p className="font-syne text-lg font-bold text-neutral-950">
                    {formatUsd(bridgeFee)}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-3">
                <p className="font-manrope text-xs text-neutral-600">USDC</p>
                {isBridgeDataLoading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p className="font-syne text-lg font-bold text-neutral-950">
                    {formatUsd(destinationUsdcEquivalent)}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-3 sm:col-span-2">
                <p className="font-manrope text-xs text-neutral-600">
                  Estimated minted
                </p>
                <p className="font-syne text-lg font-bold text-neutral-950">
                  {isEstimatorLoading
                    ? "Calculating..."
                    : `${formatToken(estimatedAfTokens)} ${selectedVault.key}`}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isReadyToZap) handleExecuteZap();
              else handleRoute();
            }}
            disabled={!isActionEnabled}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-syne text-base font-bold shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors ${
              isActionEnabled
                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                : "bg-black/10 text-neutral-500 shadow-none"
            }`}
          >
            {getButtonLabel()}
          </button>

          {isWaitingForCCIP ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-syne text-sm font-bold text-blue-900">
                    Cross-Chain Transfer in Progress
                  </p>
                  <p className="mt-1 font-manrope text-xs leading-relaxed text-blue-700">
                    ⚠️ <strong>Important:</strong> Once your assets arrive on
                    Arbitrum (Step 2 turns green), you must sign one final{" "}
                    <strong>"Claim & Zap"</strong> transaction to activate your
                    yield. Feel free to minimize this window, but don't close it
                    to stay updated.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isCompleted || isFailed ? (
            <button
              onClick={() => void handleClearState()}
              className="mt-3 w-full text-center font-manrope text-xs text-neutral-500 hover:text-neutral-700 hover:underline"
            >
              Start New Bridge Transfer
            </button>
          ) : null}

          {bridgeState.txHash || bridgeTxHash ? (
            <div className="mt-2 space-y-1">
              <p className="break-all font-manrope text-xs text-neutral-500">
                Bridge Tx: {bridgeState.txHash || bridgeTxHash}
              </p>
              {messageId ? (
                <a
                  href={`https://ccip.chain.link/msg/${messageId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all font-manrope text-xs font-bold text-blue-600 hover:underline"
                >
                  CCIP Explorer: {messageId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ) : null}
          {zapTxHash ? (
            <div className="mt-2">
              <p className="break-all font-manrope text-xs text-neutral-500">
                Zap Tx: {zapTxHash}
              </p>
            </div>
          ) : null}
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Route Guarantees
            </h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-600">
                  Source Chain
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <img
                    src={sourceChain.icon}
                    alt=""
                    className="h-5 w-5 rounded-full border border-black/15"
                  />
                  <p className="font-syne text-base font-bold text-neutral-950">
                    {sourceChain.name}
                  </p>
                  <span className="font-manrope text-xs text-neutral-500">
                    {sourceChain.networkTag}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-600">
                  Settlement Time
                </p>
                <p className="font-syne text-base font-bold text-neutral-950">
                  {sourceChain.eta}
                </p>
              </div>
              <div className="rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-600">
                  CCIP Lane
                </p>
                <p className="font-syne text-base font-bold text-neutral-950">
                  {sourceChain.ccipLane}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Execution Timeline
            </h3>
            <div className="mt-4 space-y-3">
              {timelineSteps.map((step, index) => {
                const completed = activeStep > index;
                const current = activeStep === index;
                const isReadyStep = index === 2 && isReadyToZap; // Highlight step 2 when ready

                return (
                  <div
                    key={index}
                    className={`rounded-lg border px-3 py-3 transition-colors ${
                      completed
                        ? "border-emerald-200 bg-emerald-50"
                        : current
                          ? "border-fuchsia-200 bg-fuchsia-50"
                          : "border-black/10 bg-white"
                    } ${isReadyStep ? "animate-pulse ring-2 ring-fuchsia-400" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : current ? (
                          <Clock3 className="h-5 w-5 text-fuchsia-600" />
                        ) : (
                          <Clock3 className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-syne text-sm font-bold ${completed ? "text-emerald-900" : current ? "text-fuchsia-900" : "text-neutral-900"}`}
                        >
                          {step.title}
                        </p>
                        <p className="mt-0.5 font-manrope text-xs text-neutral-600">
                          {step.subtext}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isReadyToZap && !isCompleted ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="font-syne text-base font-bold text-amber-700">
                    Action Required
                  </p>
                </div>
                <p className="mt-1 font-manrope text-sm text-amber-700">
                  Assets arrived on Arbitrum. Wallet will auto-switch for claim
                  and return to Base after success.
                </p>
              </div>
            ) : null}

            {isCompleted ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-syne text-base font-bold text-emerald-700">
                  Completed
                </p>
                <p className="mt-1 font-manrope text-sm text-emerald-700">
                  Your assets have been zapped into {selectedVault.key}.
                </p>
                <Link
                  href="/dashboard?tab=balances"
                  className="mt-3 inline-flex rounded-lg border border-emerald-300 bg-white px-3 py-1 font-syne text-sm font-bold text-emerald-700"
                >
                  View My Balances
                </Link>
              </div>
            ) : null}

            {isFailed ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="font-syne text-base font-bold text-red-700">
                    Failed
                  </p>
                </div>
                <p className="mt-1 font-manrope text-sm text-red-700">
                  The cross-chain transaction failed on the destination chain.
                </p>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </div>
  );
}
