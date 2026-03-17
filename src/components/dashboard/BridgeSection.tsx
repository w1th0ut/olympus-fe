"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
} from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";
import { createXcmTransfer, fetchXcmTransfer } from "@/lib/backend";
import { targetChain } from "@/lib/chains";
import { type VaultKey, vaultMarkets } from "@/lib/olympus";

type TransferStatus = "idle" | "queued" | "in_transit" | "completed" | "failed";

const bridgeTargets: Array<{
  key: VaultKey;
  sourceAsset: "WETH" | "WBTC" | "DOT";
  subtitle: string;
  icon: string;
}> = [
  {
    key: "afWETH",
    sourceAsset: "WETH",
    subtitle: "Route to the WETH leveraged vault",
    icon: "/icons/Logo-afWETH.png",
  },
  {
    key: "afWBTC",
    sourceAsset: "WBTC",
    subtitle: "Route to the WBTC leveraged vault",
    icon: "/icons/Logo-afWBTC.png",
  },
  {
    key: "afDOT",
    sourceAsset: "DOT",
    subtitle: "Route to the DOT leveraged vault",
    icon: "/icons/Logo-afDOT.png",
  },
];

const timelineSteps = [
  {
    title: "Queue Transfer",
    subtext: "Bridge manager accepts the XCM request.",
  },
  {
    title: "In Transit",
    subtext: "The simulated XCM route is moving across parachains.",
  },
  {
    title: "Completed",
    subtext: "The transfer reached the destination workflow queue.",
  },
] as const;

function formatToken(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}

export function BridgeSection() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [targetVault, setTargetVault] = useState<VaultKey>("afWETH");
  const [amountInput, setAmountInput] = useState("");
  const [destination, setDestination] = useState("Hydration");
  const [transferId, setTransferId] = useState("");
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("idle");
  const [updatedAtMs, setUpdatedAtMs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [errorText, setErrorText] = useState("");

  const selectedTarget =
    bridgeTargets.find((item) => item.key === targetVault) ?? bridgeTargets[0];
  const selectedVaultMarket =
    vaultMarkets.find((item) => item.key === targetVault) ?? vaultMarkets[0];
  const isOnTargetChain = chainId === targetChain.id;
  const parsedAmount = Number.parseFloat(amountInput);
  const amountValue = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const isBusy = isSubmitting || isPolling || isSwitchPending;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsPreviewLoading(false);
    }, 650);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!transferId || transferStatus === "completed" || transferStatus === "failed") {
      return;
    }

    let cancelled = false;
    let intervalHandle: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        setIsPolling(true);
        const response = await fetchXcmTransfer(transferId);
        if (cancelled) return;
        setTransferStatus(response.transfer.status);
        setUpdatedAtMs(response.transfer.updatedAtMs);
      } catch (error) {
        if (!cancelled) {
          setErrorText(error instanceof Error ? error.message : "Failed to fetch XCM status");
        }
      } finally {
        if (!cancelled) {
          setIsPolling(false);
        }
      }
    };

    void poll();
    intervalHandle = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      cancelled = true;
      if (intervalHandle) clearInterval(intervalHandle);
    };
  }, [transferId, transferStatus]);

  const activeStep = useMemo(() => {
    if (transferStatus === "completed") return 2;
    if (transferStatus === "in_transit") return 1;
    if (transferStatus === "queued") return 0;
    return -1;
  }, [transferStatus]);

  const buttonLabel = !isConnected
    ? "Connect Wallet"
    : !isOnTargetChain
      ? "Switch to Polkadot Hub TestNet"
      : amountValue <= 0
        ? "Enter an amount"
        : isSubmitting
          ? "Submitting XCM Request..."
          : transferStatus === "queued" || transferStatus === "in_transit"
            ? "XCM Transfer In Progress"
            : transferStatus === "completed"
              ? "XCM Transfer Completed"
              : "Queue XCM Transfer";

  async function handleSubmit() {
    if (!isConnected || isBusy) return;
    if (!isOnTargetChain) {
      await switchChainAsync({ chainId: targetChain.id });
      return;
    }
    if (amountValue <= 0) return;

    try {
      setErrorText("");
      setIsSubmitting(true);
      const response = await createXcmTransfer({
        sourceAsset: selectedTarget.sourceAsset,
        amount: amountValue.toString(),
        destination,
        parachain: "Hydration",
        note: `Route to ${selectedVaultMarket.key}`,
      });
      setTransferId(response.transfer.id);
      setTransferStatus(response.transfer.status);
      setUpdatedAtMs(response.transfer.updatedAtMs);
      setAmountInput("");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Failed to queue XCM transfer");
      setTransferStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetTransfer() {
    setTransferId("");
    setTransferStatus("idle");
    setUpdatedAtMs(0);
    setErrorText("");
  }

  if (isPreviewLoading) {
    return (
      <div className="mt-8">
        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <Skeleton className="h-7 w-56" />
            <div className="mt-4 space-y-5">
              <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
                <Skeleton className="h-4 w-16" />
                <div className="mt-3 flex items-center gap-3">
                  <Skeleton className="h-9 w-40 rounded-lg" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
                <Skeleton className="mt-3 h-3 w-[82%]" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <Skeleton className="h-6 w-36" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`bridge-vault-skeleton-${index}`}
                      className="rounded-xl border border-black/10 bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="mt-3 h-3 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Skeleton className="mt-5 h-11 w-full rounded-md" />
          </article>

          <div className="space-y-4">
            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <Skeleton className="h-7 w-36" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`bridge-status-skeleton-${index}`}
                    className="rounded-lg border border-black/10 bg-white px-3 py-3"
                  >
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-3 w-[85%]" />
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <Skeleton className="h-7 w-28" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[92%]" />
                <div className="rounded-lg border border-black/10 bg-white p-3">
                  <Skeleton className="h-3 w-[88%]" />
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
              <Skeleton className="h-7 w-24" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`bridge-preview-skeleton-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
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
          <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
            Simulated XCM Transfer
          </h3>

          <div className="mt-4 space-y-5">
            <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <p className="font-manrope text-sm text-neutral-600">Route</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-neutral-700">
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Polkadot Hub TestNet
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Hydration
                </span>
              </div>
              <p className="mt-2 font-manrope text-xs text-neutral-500">
                This MVP route is simulated in the backend and reflects the planned Olympus XCM workflow.
              </p>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Amount</p>
              <div className="mt-2 rounded-xl border border-black/10 bg-white p-4">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  disabled={isBusy}
                  placeholder="0.00"
                  className="w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-50"
                />
                <p className="mt-2 font-manrope text-xs text-neutral-500">
                  Source asset: {selectedTarget.sourceAsset}
                </p>
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Destination venue</p>
              <div className="mt-2 rounded-xl border border-black/10 bg-white p-4">
                <input
                  type="text"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  disabled={isBusy}
                  className="w-full bg-transparent font-manrope text-base text-neutral-950 outline-none"
                />
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Destination vault</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {bridgeTargets.map((vault) => {
                  const active = vault.key === targetVault;
                  return (
                    <button
                      key={vault.key}
                      type="button"
                      disabled={isBusy}
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
                      <p className="mt-2 font-manrope text-xs text-neutral-600">{vault.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!isConnected || isBusy || (isOnTargetChain && amountValue <= 0)}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-syne text-base font-bold shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors ${
              !isConnected || isBusy || (isOnTargetChain && amountValue <= 0)
                ? "bg-black/10 text-neutral-500 shadow-none"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            {buttonLabel}
          </button>

          {errorText ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-manrope text-sm text-red-700">{errorText}</p>
            </div>
          ) : null}

          {transferId ? (
            <div className="mt-4 rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-manrope text-xs text-neutral-500">Transfer ID</p>
                  <p className="break-all font-mono text-xs text-neutral-800">{transferId}</p>
                </div>
                <span className="inline-flex items-center gap-1 font-manrope text-xs font-semibold text-neutral-500">
                  Simulator ID
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
              <p className="mt-2 font-manrope text-xs text-neutral-500">
                Last update: {updatedAtMs ? new Date(updatedAtMs).toLocaleString("en-US") : "-"}
              </p>
            </div>
          ) : null}

          {transferStatus === "completed" || transferStatus === "failed" ? (
            <button
              type="button"
              onClick={resetTransfer}
              className="mt-3 w-full text-center font-manrope text-xs text-neutral-500 hover:text-neutral-700 hover:underline"
            >
              Start a new XCM transfer
            </button>
          ) : null}
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Transfer Status
            </h3>
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
                          ? "border-fuchsia-200 bg-fuchsia-50"
                          : "border-black/10 bg-white"
                    }`}
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
                        <p className="font-syne text-sm font-bold text-neutral-900">{step.title}</p>
                        <p className="mt-0.5 font-manrope text-xs text-neutral-600">{step.subtext}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isPolling && transferId ? <Skeleton className="h-4 w-full" /> : null}
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Narrative
            </h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              <p className="font-manrope">
                Olympus presents this route as a Polkadot-native XCM workflow with Hydration as the downstream liquidity venue.
              </p>
              <p className="font-manrope">
                For the current MVP, execution is simulated through the backend so the UI remains deterministic during demos.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                  <p className="font-manrope text-xs text-amber-700">
                    Native XCM precompile integration can be added later without changing this front-end flow.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Preview
            </h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Asset</span>
                <span className="font-syne text-sm font-bold text-neutral-950">{selectedTarget.sourceAsset}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Destination</span>
                <span className="font-syne text-sm font-bold text-neutral-950">{destination}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Vault</span>
                <span className="font-syne text-sm font-bold text-neutral-950">{selectedVaultMarket.key}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Requested amount</span>
                <span className="font-syne text-sm font-bold text-neutral-950">
                  {formatToken(amountValue)} {selectedTarget.sourceAsset}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
