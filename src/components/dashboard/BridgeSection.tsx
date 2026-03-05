"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";

type VaultKey = "afWETH" | "afWBTC" | "afLINK";

const sourceChain = {
  name: "Base",
  networkTag: "L2",
  icon: "/icons/Logo-Base.png",
  eta: "~2-4 min",
  ccipLane: "BASE -> ARB",
} as const;

const vaultTargets: {
  key: VaultKey;
  subtitle: string;
  expectedApy: string;
  estimatePriceUsd: number;
  icon: string;
}[] = [
  {
    key: "afWETH",
    subtitle: "Linearized WETH yield",
    expectedApy: "27.12%",
    estimatePriceUsd: 2660,
    icon: "/icons/Logo-afWETH.png",
  },
  {
    key: "afWBTC",
    subtitle: "Linearized WBTC yield",
    expectedApy: "36.30%",
    estimatePriceUsd: 67414,
    icon: "/icons/Logo-afWBTC.png",
  },
  {
    key: "afLINK",
    subtitle: "Linearized LINK yield",
    expectedApy: "27.12%",
    estimatePriceUsd: 23.4,
    icon: "/icons/Logo-afLINK.png",
  },
];

const processSteps = [
  "Lock USDC on Base",
  "Transmit CCIP message to Arbitrum",
  "Execute Zap into selected Earn Vault",
  "Mint afToken to your wallet",
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
  const [targetVault, setTargetVault] = useState<VaultKey>("afWETH");
  const [amountInput, setAmountInput] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const selectedVault = vaultTargets.find((item) => item.key === targetVault) ?? vaultTargets[0];

  const amount = Number.parseFloat(amountInput);
  const parsedAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  const bridgeFee = useMemo(() => {
    if (parsedAmount <= 0) {
      return 0;
    }

    const dynamicFee = parsedAmount * 0.0025;
    const laneFee = 0.9;
    return dynamicFee + laneFee;
  }, [parsedAmount]);

  const destinationAmount = Math.max(parsedAmount - bridgeFee, 0);
  const estimatedAfTokens = destinationAmount / selectedVault.estimatePriceUsd;

  const canRoute = parsedAmount > 0 && !isRouting;
  const isCompleted = activeStep >= processSteps.length;

  useEffect(() => {
    if (!isRouting) {
      return;
    }

    if (activeStep >= processSteps.length) {
      const doneTimer = window.setTimeout(() => {
        setIsRouting(false);
      }, 1200);

      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      setActiveStep((previous) => previous + 1);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [activeStep, isRouting]);

  const handleRoute = () => {
    if (!canRoute) {
      return;
    }

    setActiveStep(0);
    setIsRouting(true);
  };

  return (
    <div className="mt-8">
      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Bridge Request</h3>

          <div className="mt-4 space-y-5">
            <div className="rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
              <p className="font-manrope text-sm text-neutral-600">Route</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-neutral-700">
                <span className="rounded-lg border border-black/15 bg-white px-3 py-1 font-syne text-sm font-bold">
                  Base
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 font-syne text-sm font-bold text-emerald-700">
                  Arbitrum
                </span>
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Deposit amount (USDC)</p>
              <div className="mt-2 rounded-xl border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                  <span className="rounded-full border border-black/15 bg-[#f6f6f6] px-3 py-1 font-syne text-sm font-bold text-neutral-950">
                    USDC
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Choose destination Earn vault</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {vaultTargets.map((vault) => {
                  const active = vault.key === targetVault;

                  return (
                    <button
                      key={vault.key}
                      type="button"
                      onClick={() => setTargetVault(vault.key)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-neutral-950 bg-black/[0.04]"
                          : "border-black/10 bg-white hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={vault.icon} alt="" className="h-6 w-6 rounded-full border border-black/15" />
                        <p className="font-syne text-sm font-bold text-neutral-950">{vault.key}</p>
                      </div>
                      <p className="mt-2 font-manrope text-xs text-neutral-600">{vault.subtitle}</p>
                      <p className="mt-1 font-syne text-sm font-bold text-emerald-600">{vault.expectedApy} APY</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-black/10 bg-[#f8f8f8] p-4">
            <p className="font-syne text-base font-bold text-neutral-950">Route Preview</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-black/10 bg-white p-3">
                <p className="font-manrope text-xs text-neutral-600">Estimated bridge fee</p>
                <p className="font-syne text-lg font-bold text-neutral-950">{formatUsd(bridgeFee)}</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-3">
                <p className="font-manrope text-xs text-neutral-600">USDC arriving on Arbitrum</p>
                <p className="font-syne text-lg font-bold text-neutral-950">{formatUsd(destinationAmount)}</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-3 sm:col-span-2">
                <p className="font-manrope text-xs text-neutral-600">Estimated minted</p>
                <p className="font-syne text-lg font-bold text-neutral-950">
                  {formatToken(estimatedAfTokens)} {selectedVault.key}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRoute}
            disabled={!canRoute}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-syne text-base font-bold shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors ${
              canRoute
                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                : "bg-black/10 text-neutral-500 shadow-none"
            }`}
          >
            {isRouting ? "Routing via CCIP..." : "Bridge USDC and Zap to Earn"}
          </button>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">Route Guarantees</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-600">Source Chain</p>
                <div className="mt-1 flex items-center gap-2">
                  <img src={sourceChain.icon} alt="" className="h-5 w-5 rounded-full border border-black/15" />
                  <p className="font-syne text-base font-bold text-neutral-950">{sourceChain.name}</p>
                  <span className="font-manrope text-xs text-neutral-500">{sourceChain.networkTag}</span>
                </div>
              </div>
              <div className="rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-600">Settlement Time</p>
                <p className="font-syne text-base font-bold text-neutral-950">{sourceChain.eta}</p>
              </div>
              <div className="rounded-lg border border-black/10 p-3">
                <p className="font-manrope text-xs text-neutral-600">CCIP Lane</p>
                <p className="font-syne text-base font-bold text-neutral-950">{sourceChain.ccipLane}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">Execution Timeline</h3>
            <div className="mt-4 space-y-3">
              {processSteps.map((step, index) => {
                const completed = activeStep > index;
                const current = activeStep === index;

                return (
                  <div
                    key={step}
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      completed
                        ? "border-emerald-200 bg-emerald-50"
                        : current
                          ? "border-fuchsia-200 bg-fuchsia-50"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : current ? (
                        <Clock3 className="h-4 w-4 text-fuchsia-600" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-neutral-400" />
                      )}
                      <p className="font-manrope text-sm text-neutral-800">{step}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCompleted ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-syne text-base font-bold text-emerald-700">Completed</p>
                <p className="mt-1 font-manrope text-sm text-emerald-700">
                  Your USDC has been bridged and zapped into {selectedVault.key}.
                </p>
                <Link
                  href="/dashboard?tab=balances"
                  className="mt-3 inline-flex rounded-lg border border-emerald-300 bg-white px-3 py-1 font-syne text-sm font-bold text-emerald-700"
                >
                  View My Balances
                </Link>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </div>
  );
}
