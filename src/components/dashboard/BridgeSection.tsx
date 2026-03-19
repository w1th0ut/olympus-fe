"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { fetchActivityFeed } from "@/lib/backend";
import { baseSepolia } from "@/lib/chains";
import { useBackendMarketPrices } from "@/hooks/useBackendMarketPrices";
import { useInitialSkeleton } from "@/hooks/useInitialSkeleton";
import { type VaultKey, vaultMarkets } from "@/lib/olympus";
import { Skeleton } from "@/components/ui/skeleton";

const baseBridgeAbi = [
  {
    name: "bridgeAndDeposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "vault", type: "address" },
      { name: "relayerFee", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type TransferStatus = "idle" | "initiated" | "in_transit" | "completed" | "failed";

const bridgeTargets: Array<{
  key: VaultKey;
  baseSymbol: "WETH" | "WBTC" | "DOT";
  apy: string;
  icon: string;
}> = [
  {
    key: "afWETH",
    baseSymbol: "WETH",
    apy: "0.21%",
    icon: "/icons/Logo-afWETH.png",
  },
  {
    key: "afWBTC",
    baseSymbol: "WBTC",
    apy: "0.11%",
    icon: "/icons/Logo-afWBTC.png",
  },
  {
    key: "afDOT",
    baseSymbol: "DOT",
    apy: "0.04%",
    icon: "/icons/Logo-afDOT.png",
  },
];

const timelineSteps = [
  {
    title: "Initiate Bridge",
    subtext: "Submit a USD.h bridge transaction on Base Sepolia.",
  },
  {
    title: "Hyperbridge Transit",
    subtext: "Hyperbridge relayers deliver the message to Polkadot Hub (testnet delivery can take up to ~20 minutes).",
  },
  {
    title: "Auto-Deposit",
    subtext: "USD.h is converted and auto-deposited into the selected Olympus vault.",
  },
] as const;

const BASE_BRIDGE_ADDRESS = (process.env.NEXT_PUBLIC_BASE_BRIDGE_ADDRESS ??
  zeroAddress) as `0x${string}`;
const BASE_USDH_ADDRESS = (process.env.NEXT_PUBLIC_BASE_USDH_ADDRESS ??
  zeroAddress) as `0x${string}`;
const RELAYER_FEE_USDH = "0.01";
const USDH_DECIMALS = 18;
const fallbackSpotUsd: Record<"WETH" | "WBTC" | "DOT", number> = {
  WETH: 2000,
  WBTC: 70000,
  DOT: 1.55,
};

export function BridgeSection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const [targetVault, setTargetVault] = useState<VaultKey>("afWETH");
  const [amountInput, setAmountInput] = useState("");
  const [transferTxHash, setTransferTxHash] = useState<`0x${string}` | null>(null);
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("idle");
  const [errorText, setErrorText] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const { prices } = useBackendMarketPrices();

  const selectedTarget = bridgeTargets.find((item) => item.key === targetVault) ?? bridgeTargets[0];
  const selectedVaultMarket = vaultMarkets.find((item) => item.key === targetVault) ?? vaultMarkets[0];

  const isBaseSepolia = chainId === baseSepolia.id;
  const hasBridgeConfiguration =
    BASE_BRIDGE_ADDRESS !== zeroAddress && BASE_USDH_ADDRESS !== zeroAddress;

  let rawAmount = BigInt(0);
  const normalizedAmountInput = amountInput.trim();
  if (normalizedAmountInput) {
    try {
      rawAmount = parseUnits(normalizedAmountInput, USDH_DECIMALS);
    } catch {
      rawAmount = BigInt(0);
    }
  }
  const amountValue = Number.parseFloat(normalizedAmountInput);
  const isAmountValid =
    Number.isFinite(amountValue) && amountValue > 0 && rawAmount > BigInt(0);
  const relayerFeeRaw = parseUnits(RELAYER_FEE_USDH, USDH_DECIMALS);

  const { writeContractAsync, data: writeData, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  const { data: sourceTokenBalance, isLoading: isSourceBalanceLoading } = useBalance({
    address,
    chainId: baseSepolia.id,
    token: BASE_USDH_ADDRESS,
    query: { enabled: !!address && BASE_USDH_ADDRESS !== zeroAddress },
  });

  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isAllowanceLoading,
  } = useReadContract({
    address: BASE_USDH_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? zeroAddress, BASE_BRIDGE_ADDRESS],
    query: {
      enabled:
        !!address &&
        isBaseSepolia &&
        BASE_USDH_ADDRESS !== zeroAddress &&
        BASE_BRIDGE_ADDRESS !== zeroAddress,
    },
  });

  const needsApproval = allowance !== undefined ? allowance < rawAmount : false;

  useEffect(() => {
    if (transferStatus === "initiated" && isTxSuccess) {
      setTransferStatus("in_transit");
    }
  }, [isTxSuccess, transferStatus]);

  useEffect(() => {
    if (!isTxSuccess) return;
    void refetchAllowance();
  }, [isTxSuccess, refetchAllowance]);

  useEffect(() => {
    if (transferStatus !== "in_transit") return;

    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const feed = await fetchActivityFeed(new URLSearchParams({ limit: "20" }));

        const myLog = feed.items?.find((item) => {
          const event = String(item?.event || "");
          const user = String(item?.metadata?.user || "").toLowerCase();
          return event === "HyperbridgeAutoDeposit" && user === address?.toLowerCase();
        });

        if (myLog) {
          setTransferStatus("completed");
          setIsPolling(false);
          clearInterval(interval);
        }
      } catch {
        // Keep polling and show current transaction status in the UI.
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transferStatus, address]);

  async function handleAction() {
    if (!isConnected) return;
    if (!hasBridgeConfiguration) {
      setErrorText("Bridge configuration is missing. Set NEXT_PUBLIC_BASE_BRIDGE_ADDRESS and NEXT_PUBLIC_BASE_USDH_ADDRESS.");
      return;
    }
    if (!isBaseSepolia) {
      await switchChainAsync({ chainId: baseSepolia.id });
      return;
    }

    try {
      setErrorText("");

      if (needsApproval) {
        await writeContractAsync({
          address: BASE_USDH_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [BASE_BRIDGE_ADDRESS, rawAmount],
        });
        await refetchAllowance();
        return;
      }

      const tx = await writeContractAsync({
        address: BASE_BRIDGE_ADDRESS,
        abi: baseBridgeAbi,
        functionName: "bridgeAndDeposit",
        args: [BASE_USDH_ADDRESS, rawAmount, selectedVaultMarket.vaultAddress, relayerFeeRaw],
      });

      setTransferTxHash(tx);
      setTransferStatus("initiated");
      setAmountInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      setTransferStatus("failed");
      setErrorText(message);
    }
  }

  const activeStep = useMemo(() => {
    if (transferStatus === "completed") return 2;
    if (transferStatus === "in_transit") return 1;
    if (transferStatus === "initiated") return 0;
    return -1;
  }, [transferStatus]);

  const sourceBalanceText = sourceTokenBalance
    ? Number(formatUnits(sourceTokenBalance.value, USDH_DECIMALS)).toFixed(4)
    : "0.0000";
  const isInitialSectionLoading = useInitialSkeleton(
    isConnected ? isSourceBalanceLoading || isAllowanceLoading : false,
  );
  const estimatedUsdcOut = isAmountValid ? amountValue : 0;
  const selectedSpotPriceUsd =
    prices[selectedTarget.baseSymbol]?.priceUsd ?? fallbackSpotUsd[selectedTarget.baseSymbol];
  const estimatedBaseOut =
    selectedSpotPriceUsd > 0 ? estimatedUsdcOut / selectedSpotPriceUsd : 0;
  const estimatedBridgeFeeUsd = Number(RELAYER_FEE_USDH);

  if (isInitialSectionLoading) {
    return (
      <div className="mt-8">
        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <Skeleton className="h-8 w-64" />
            <div className="mt-4 space-y-5">
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="mt-2 h-5 w-64" />
              </div>
              <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
                <Skeleton className="h-4 w-16" />
                <div className="mt-2 flex items-center gap-3">
                  <Skeleton className="h-8 w-28 rounded-lg" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-8 w-44 rounded-lg" />
                </div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-28" />
                <div className="mt-2 rounded-xl border border-black/10 bg-white p-4">
                  <Skeleton className="h-10 w-28" />
                  <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-52" />
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`bridge-vault-skeleton-${index}`}
                      className="rounded-xl border border-black/10 bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="mt-2 h-3 w-32" />
                      <Skeleton className="mt-2 h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <Skeleton className="h-6 w-36" />
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>
                <Skeleton className="mt-3 h-20 rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </article>

          <div className="space-y-4">
            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <Skeleton className="h-7 w-40" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`bridge-status-skeleton-${index}`} className="h-20 rounded-lg" />
                ))}
              </div>
            </article>
            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </article>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
              Hyperbridge Cross-chain
            </h3>
          </div>

          <div className="mt-4 space-y-5">
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="font-manrope text-sm text-neutral-600">Need USD.h for testing?</p>
              <a
                href="https://docs.hyperbridge.network/developers/evm/testnet-fee-token/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-syne text-base font-bold text-neutral-950 hover:underline"
              >
                Get USD.h test tokens (Faucet)
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <p className="font-manrope text-sm text-neutral-600">Route</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-neutral-700">
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Base Sepolia
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Polkadot Hub TestNet
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
              <p className="font-syne text-sm font-bold text-blue-900">Auto-Deposit Enabled</p>
              <p className="mt-1 font-manrope text-xs text-blue-700">
                The receiver auto-zaps bridged USD.h into the selected vault and mints afTOKEN to
                your wallet.
              </p>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Amount (USD.h)</p>
              <div className="mt-2 rounded-xl border border-black/10 bg-white p-4">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  disabled={transferStatus !== "idle" && transferStatus !== "completed" && transferStatus !== "failed"}
                  placeholder="0.00"
                  className="w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-50"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-manrope text-xs text-neutral-500">Source token: USD.h</p>
                  <p className="font-manrope text-xs text-neutral-500">Balance on Base: {sourceBalanceText} USD.h</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Choose destination Earn vault</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {bridgeTargets.map((vault) => {
                  const active = vault.key === targetVault;
                  return (
                    <button
                      key={vault.key}
                      type="button"
                      disabled={transferStatus !== "idle" && transferStatus !== "completed" && transferStatus !== "failed"}
                      onClick={() => setTargetVault(vault.key)}
                      className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-50 ${
                        active
                          ? "border-neutral-950 bg-black/[0.04]"
                          : "border-black/10 bg-white hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={vault.icon} alt="" className="h-7 w-7 shrink-0 object-contain" />
                        <p className="font-syne text-sm font-bold text-neutral-950">{vault.key}</p>
                      </div>
                      <p className="mt-2 font-manrope text-xs text-neutral-600">
                        Linearized {vault.baseSymbol} yield
                      </p>
                      <p className="mt-1 font-syne text-sm font-bold text-emerald-600">
                        {vault.apy} APY
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4">
              <h4 className="font-syne text-base font-bold text-neutral-950">Route Preview</h4>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-black/10 p-3">
                  <p className="font-manrope text-xs text-neutral-500">Estimated bridge fee</p>
                  <p className="mt-1 font-syne text-xl font-bold text-neutral-950">
                    ${estimatedBridgeFeeUsd.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border border-black/10 p-3">
                  <p className="font-manrope text-xs text-neutral-500">USDC</p>
                  <p className="mt-1 font-syne text-xl font-bold text-neutral-950">
                    ${estimatedUsdcOut.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-500">Estimated minted</p>
                <p className="mt-1 font-syne text-xl font-bold text-neutral-950">
                  {estimatedBaseOut.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                  {selectedTarget.key}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAction}
            disabled={
              !isConnected ||
              !hasBridgeConfiguration ||
              isSwitchPending ||
              isWritePending ||
              isConfirming ||
              (isBaseSepolia && !isAmountValid)
            }
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-syne text-base font-bold shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors ${
              !isConnected ||
              !hasBridgeConfiguration ||
              isSwitchPending ||
              isWritePending ||
              isConfirming ||
              (isBaseSepolia && !isAmountValid)
                ? "bg-black/10 text-neutral-500 shadow-none"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSwitchPending
              ? "Switching Network..."
              : isWritePending || isConfirming
                ? "Confirming..."
                : !isBaseSepolia
                  ? "Switch to Base Sepolia"
                  : !hasBridgeConfiguration
                    ? "Bridge Not Configured"
                    : needsApproval
                      ? "Approve USD.h"
                      : "Bridge and Deposit"}
          </button>

          {errorText && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-manrope text-sm text-red-700">{errorText}</p>
            </div>
          )}

          {transferTxHash && (
            <div className="mt-4 rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-manrope text-xs text-neutral-500">Base Tx Hash</p>
                  <p className="break-all font-mono text-xs text-neutral-800">{transferTxHash}</p>
                </div>
                <a
                  href={`https://sepolia.basescan.org/tx/${transferTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-manrope text-xs font-semibold text-blue-600 hover:underline"
                >
                  View on BaseScan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">Live Bridge Status</h3>
            <div className="mt-4 space-y-3">
              {timelineSteps.map((step, index) => {
                const completed = activeStep > index;
                const current = activeStep === index;

                return (
                  <div
                    key={step.title}
                    className={`rounded-lg border px-3 py-3 transition-colors ${
                      completed
                        ? "border-emerald-200 bg-emerald-50"
                        : current
                          ? "border-blue-200 bg-blue-50"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : current ? (
                          <Clock3 className="h-5 w-5 animate-pulse text-blue-600" />
                        ) : (
                          <Clock3 className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-syne text-sm font-bold text-neutral-900">{step.title}</p>
                        <p className="mt-0.5 font-manrope text-xs text-neutral-600">{step.subtext}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isPolling && (
                <p className="text-center font-manrope text-[10px] italic text-neutral-400">
                  Polling Polkadot Hub for auto-deposit confirmation...
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">Hyperbridge Security</h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              <p className="font-manrope">
                Olympus uses Hyperbridge for decentralized cross-chain delivery between Base and
                Polkadot Hub.
              </p>
              <p className="font-manrope">
                Messages are verified on destination before the receiver executes vault
                auto-deposit.
              </p>
            </div>
          </article>

        </div>
      </section>
    </div>
  );
}
