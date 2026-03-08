"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import {
  useAccount,
  useChainId,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { aaveAbi, erc20Abi, sourceRouterAbi } from "@/lib/apollos-abi";
import { apollosAddresses, ccipSelectors, vaultMarkets } from "@/lib/apollos";
import { baseSepolia } from "wagmi/chains";

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
  targetBaseAsset: `0x${string}`;
}[] = [
  {
    key: "afWETH",
    subtitle: "Linearized WETH yield",
    expectedApy: "27.12%",
    estimatePriceUsd: 2660,
    icon: "/icons/Logo-afWETH.png",
    targetBaseAsset: apollosAddresses.weth,
  },
  {
    key: "afWBTC",
    subtitle: "Linearized WBTC yield",
    expectedApy: "36.30%",
    estimatePriceUsd: 67414,
    icon: "/icons/Logo-afWBTC.png",
    targetBaseAsset: apollosAddresses.wbtc,
  },
  {
    key: "afLINK",
    subtitle: "Linearized LINK yield",
    expectedApy: "27.12%",
    estimatePriceUsd: 23.4,
    icon: "/icons/Logo-afLINK.png",
    targetBaseAsset: apollosAddresses.link,
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
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const [targetVault, setTargetVault] = useState<VaultKey>("afWETH");
  const [amountInput, setAmountInput] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const selectedVault =
    vaultTargets.find((item) => item.key === targetVault) ?? vaultTargets[0];

  const amount = Number.parseFloat(amountInput);
  const parsedAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const amountRaw = useMemo(() => {
    if (parsedAmount <= 0) return BigInt(0);
    try {
      return parseUnits(parsedAmount.toString(), 6);
    } catch {
      return BigInt(0);
    }
  }, [parsedAmount]);

  const { data: bridgeReads } = useReadContracts({
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
      {
        address: apollosAddresses.aavePool,
        abi: aaveAbi,
        functionName: "assetPrices",
        args: [apollosAddresses.weth],
      },
    ],
    allowFailure: true,
    query: {
      enabled: Boolean(address),
      refetchInterval: 12000,
    },
  });

  const chainSupported =
    (bridgeReads?.[0]?.result as boolean | undefined) ?? false;
  const assetSupported =
    (bridgeReads?.[1]?.result as boolean | undefined) ?? false;
  const baseUsdcBalanceRaw =
    (bridgeReads?.[2]?.result as bigint | undefined) ?? BigInt(0);
  const allowanceRaw =
    (bridgeReads?.[3]?.result as bigint | undefined) ?? BigInt(0);
  const bridgeFeeRaw =
    (bridgeReads?.[4]?.result as bigint | undefined) ?? BigInt(0);
  const wethPriceRaw =
    (bridgeReads?.[5]?.result as bigint | undefined) ?? BigInt(0);

  const bridgeFeeEth = Number(formatUnits(bridgeFeeRaw, 18));
  const wethPriceUsd = Number(formatUnits(wethPriceRaw, 8));
  const bridgeFee =
    bridgeFeeEth *
    (Number.isFinite(wethPriceUsd) && wethPriceUsd > 0 ? wethPriceUsd : 2600);

  // Apply 10x conversion: 1 CCIP-BnM = 10 USDC equivalent
  const destinationUsdcEquivalent = parsedAmount * 10;
  const estimatedAfTokens =
    destinationUsdcEquivalent / selectedVault.estimatePriceUsd;

  const needsApproval = amountRaw > BigInt(0) && allowanceRaw < amountRaw;
  const baseCcipBnmBalance = Number(formatUnits(baseUsdcBalanceRaw, 18)); // CCIP-BnM has 18 decimals

  const isOnBase = chainId === baseSepolia.id;
  const canRoute =
    parsedAmount > 0 &&
    parsedAmount <= baseCcipBnmBalance &&
    chainSupported &&
    assetSupported;

  const {
    writeContractAsync,
    data: txHash,
    isPending: isWritePending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isBusy = isRouting || isSwitchPending || isWritePending || isConfirming;
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

  useEffect(() => {
    if (isSuccess && txHash) {
      setActiveStep(processSteps.length);
      setIsRouting(true);
    }
  }, [isSuccess, txHash]);

  const handleRoute = async () => {
    if (!isConnected || !address || !canRoute || isBusy) {
      return;
    }

    try {
      if (!isOnBase) {
        await switchChainAsync({ chainId: baseSepolia.id });
        return;
      }

      if (needsApproval) {
        await writeContractAsync({
          address: apollosAddresses.baseCcipBnm,
          abi: erc20Abi,
          functionName: "approve",
          args: [apollosAddresses.sourceRouter, amountRaw],
          chainId: baseSepolia.id,
        });
        return;
      }

      setActiveStep(0);
      setIsRouting(true);

      await writeContractAsync({
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
      setIsRouting(false);
      setActiveStep(-1);
    }
  };

  const buttonLabel = !isConnected
    ? "Connect Wallet"
    : !isOnBase
      ? "Switch to Base"
      : needsApproval
        ? "Approve CCIP-BnM"
        : isBusy
          ? "Routing via CCIP..."
          : "Bridge CCIP-BnM and Zap to Earn";

  return (
    <div className="mt-8">
      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
            Bridge Request
          </h3>

          <div className="mt-4 space-y-5">
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
                    placeholder="0.00"
                    className="w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                  <span className="rounded-full border border-black/15 bg-[#f6f6f6] px-3 py-1 font-syne text-sm font-bold text-neutral-950">
                    CCIP-BnM
                  </span>
                </div>
              </div>
              <p className="mt-2 font-manrope text-xs text-neutral-500">
                Wallet balance: {formatToken(baseCcipBnmBalance)} CCIP-BnM
              </p>
              <p className="mt-1 font-manrope text-xs text-emerald-600">
                1 CCIP-BnM = 10 USDC equivalent
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
                      onClick={() => setTargetVault(vault.key)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-neutral-950 bg-black/[0.04]"
                          : "border-black/10 bg-white hover:bg-black/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={vault.icon}
                          alt=""
                          className="h-6 w-6 rounded-full border border-black/15"
                        />
                        <p className="font-syne text-sm font-bold text-neutral-950">
                          {vault.key}
                        </p>
                      </div>
                      <p className="mt-2 font-manrope text-xs text-neutral-600">
                        {vault.subtitle}
                      </p>
                      <p className="mt-1 font-syne text-sm font-bold text-emerald-600">
                        {vault.expectedApy} APY
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
                <p className="font-syne text-lg font-bold text-neutral-950">
                  {formatUsd(bridgeFee)}
                </p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-3">
                <p className="font-manrope text-xs text-neutral-600">
                  USDC equivalent (10x)
                </p>
                <p className="font-syne text-lg font-bold text-neutral-950">
                  {formatUsd(destinationUsdcEquivalent)}
                </p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-3 sm:col-span-2">
                <p className="font-manrope text-xs text-neutral-600">
                  Estimated minted
                </p>
                <p className="font-syne text-lg font-bold text-neutral-950">
                  {formatToken(estimatedAfTokens)} {selectedVault.key}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void handleRoute();
            }}
            disabled={!canRoute || isBusy || !isConnected}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-syne text-base font-bold shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors ${
              canRoute && !isBusy && isConnected
                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                : "bg-black/10 text-neutral-500 shadow-none"
            }`}
          >
            {buttonLabel}
          </button>
          {!chainSupported || !assetSupported ? (
            <p className="mt-2 font-manrope text-xs text-red-600">
              Source router belum support lane/asset ini.
            </p>
          ) : null}
          {txHash ? (
            <p className="mt-2 break-all font-manrope text-xs text-neutral-500">
              Tx: {txHash}
            </p>
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
                      <p className="font-manrope text-sm text-neutral-800">
                        {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCompleted ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-syne text-base font-bold text-emerald-700">
                  Completed
                </p>
                <p className="mt-1 font-manrope text-sm text-emerald-700">
                  Your CCIP-BnM has been bridged (10x USDC equivalent) and
                  zapped into {selectedVault.key}.
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
