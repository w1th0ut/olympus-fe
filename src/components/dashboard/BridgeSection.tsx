"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { parseUnits, formatUnits } from "viem";
import { 
  useAccount, 
  useChainId, 
  useSwitchChain, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContract
} from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchActivityFeed } from "@/lib/backend";
import { targetChain, baseSepolia } from "@/lib/chains";
import { type VaultKey, vaultMarkets, olympusAddresses } from "@/lib/olympus";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Simplified ABIs for the bridge
const baseBridgeAbi = [
  {
    name: "bridgeAndDeposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "vault", type: "address" },
      { name: "relayerFee", type: "uint256" }
    ],
    outputs: []
  }
] as const;

const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

type TransferStatus = "idle" | "initiated" | "in_transit" | "completed" | "failed";

const bridgeTargets: Array<{
  key: VaultKey;
  sourceAsset: "WETH" | "WBTC" | "DOT";
  subtitle: string;
  icon: string;
  baseTokenAddress: `0x${string}`;
}> = [
  {
    key: "afWETH",
    sourceAsset: "WETH",
    subtitle: "Route to the WETH leveraged vault",
    icon: "/icons/Logo-afWETH.png",
    baseTokenAddress: "0x4200000000000000000000000000000000000006", // Placeholder Base Sepolia WETH
  },
  {
    key: "afWBTC",
    sourceAsset: "WBTC",
    subtitle: "Route to the WBTC leveraged vault",
    icon: "/icons/Logo-afWBTC.png",
    baseTokenAddress: "0x0000000000000000000000000000000000000000", // Placeholder
  },
  {
    key: "afDOT",
    sourceAsset: "DOT",
    subtitle: "Route to the DOT leveraged vault",
    icon: "/icons/Logo-afDOT.png",
    baseTokenAddress: "0x0000000000000000000000000000000000000000", // Placeholder
  },
];

const timelineSteps = [
  {
    title: "Initiate Bridge",
    subtext: "Teleport assets from Base Sepolia via Hyperbridge.",
  },
  {
    title: "Hyperbridge Transit",
    subtext: "Assets are moving across the Hyperbridge relayer network.",
  },
  {
    title: "Auto-Deposit",
    subtext: "Dana otomatis masuk ke Olympus Vault di Polkadot Hub.",
  },
] as const;

// Placeholder address for our bridge contract on Base Sepolia
const BASE_BRIDGE_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: Replace after deploy

export function BridgeSection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  
  const [targetVault, setTargetVault] = useState<VaultKey>("afWETH");
  const [amountInput, setAmountInput] = useState("");
  const [autoDeposit, setAutoDeposit] = useState(true);
  
  const [transferTxHash, setTransferTxHash] = useState<`0x${string}` | null>(null);
  const [transferStatus, setTransferStatus] = useState<TransferStatus>("idle");
  const [errorText, setErrorText] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  const selectedTarget = bridgeTargets.find((item) => item.key === targetVault) ?? bridgeTargets[0];
  const selectedVaultMarket = vaultMarkets.find((item) => item.key === targetVault) ?? vaultMarkets[0];
  
  const isBaseSepolia = chainId === baseSepolia.id;
  const parsedAmount = Number.parseFloat(amountInput);
  const amountValue = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const rawAmount = parseUnits(amountValue.toString(), selectedVaultMarket.decimals);

  const { writeContractAsync, data: writeData, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedTarget.baseTokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, BASE_BRIDGE_ADDRESS as `0x${string}`],
    query: { enabled: !!address && isBaseSepolia && !!selectedTarget.baseTokenAddress }
  });

  const needsApproval = allowance !== undefined && allowance < rawAmount;

  // Poll Backend Activity Feed for AutoDeposit event
  useEffect(() => {
    if (transferStatus !== "initiated" && transferStatus !== "in_transit") return;

    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const params = new URLSearchParams({
          limit: "5",
          workflow: "olympus-bridge-manager"
        });
        const feed = await fetchActivityFeed(params);
        
        // Look for our address in the logs
        const myLog = feed.items?.find(item => 
          item.event === "HyperbridgeAutoDeposit" && 
          item.metadata?.user?.toString().toLowerCase() === address?.toLowerCase()
        );

        if (myLog) {
          setTransferStatus("completed");
          setIsPolling(false);
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Polling failed", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transferStatus, address]);

  async function handleAction() {
    if (!isConnected) return;
    if (!isBaseSepolia) {
      await switchChainAsync({ chainId: baseSepolia.id });
      return;
    }

    try {
      setErrorText("");
      
      if (needsApproval) {
        await writeContractAsync({
          address: selectedTarget.baseTokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [BASE_BRIDGE_ADDRESS as `0x${string}`, rawAmount],
        });
        await refetchAllowance();
        return;
      }

      const tx = await writeContractAsync({
        address: BASE_BRIDGE_ADDRESS as `0x${string}`,
        abi: baseBridgeAbi,
        functionName: "bridgeAndDeposit",
        args: [
          selectedTarget.baseTokenAddress,
          rawAmount,
          selectedVaultMarket.vaultAddress,
          parseUnits("0.01", 18) // relayerFee in USD.h (subsidized by contract)
        ]
      });

      setTransferTxHash(tx);
      setTransferStatus("initiated");
      setAmountInput("");
    } catch (e: any) {
      setErrorText(e.message || "Transaction failed");
    }
  }

  const activeStep = useMemo(() => {
    if (transferStatus === "completed") return 2;
    if (transferStatus === "in_transit" || (transferStatus === "initiated" && isTxSuccess)) return 1;
    if (transferStatus === "initiated") return 0;
    return -1;
  }, [transferStatus, isTxSuccess]);

  return (
    <div className="mt-8">
      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">
              Hyperbridge Cross-chain
            </h3>
            <div className="flex items-center space-x-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700 border border-blue-100">
               <ShieldCheck className="h-4 w-4" />
               <span className="text-xs font-bold font-syne uppercase tracking-wider">Secure</span>
            </div>
          </div>

          <div className="mt-4 space-y-5">
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

            <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50/30">
               <div className="space-y-0.5">
                  <Label className="text-sm font-bold font-syne text-blue-900">Auto-Deposit on Arrival</Label>
                  <p className="text-xs text-blue-700 font-manrope">Automatically deposit tokens into the selected vault once they reach Polkadot Hub.</p>
               </div>
               <Switch 
                  checked={autoDeposit} 
                  onCheckedChange={setAutoDeposit}
                  className="data-[state=checked]:bg-blue-600"
               />
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
                  disabled={transferStatus !== "idle" && transferStatus !== "completed"}
                  placeholder="0.00"
                  className="w-full bg-transparent font-syne text-3xl font-bold text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-50"
                />
                <div className="mt-2 flex items-center justify-between">
                   <p className="font-manrope text-xs text-neutral-500">
                    Asset: {selectedTarget.sourceAsset}
                  </p>
                  <p className="font-manrope text-xs text-neutral-500">
                    Balance on Base: 0.00
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-manrope text-sm text-neutral-600">Select Destination Vault</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {bridgeTargets.map((vault) => {
                  const active = vault.key === targetVault;
                  return (
                    <button
                      key={vault.key}
                      type="button"
                      disabled={transferStatus !== "idle" && transferStatus !== "completed"}
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
            onClick={handleAction}
            disabled={!isConnected || isWritePending || isConfirming || (isBaseSepolia && amountValue <= 0)}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 font-syne text-base font-bold shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors ${
              !isConnected || isWritePending || isConfirming || (isBaseSepolia && amountValue <= 0)
                ? "bg-black/10 text-neutral-500 shadow-none"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isWritePending || isConfirming 
               ? "Confirming..." 
               : !isBaseSepolia 
                 ? "Switch to Base Sepolia" 
                 : needsApproval 
                   ? `Approve ${selectedTarget.sourceAsset}` 
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
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Live Bridge Status
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
                          ? "border-blue-200 bg-blue-50"
                          : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : current ? (
                          <Clock3 className="h-5 w-5 text-blue-600 animate-pulse" />
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
              {isPolling && <p className="text-center text-[10px] text-neutral-400 font-manrope italic">Polling Polkadot Hub for arrival...</p>}
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Hyperbridge Security
            </h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              <p className="font-manrope">
                Olympus uses Hyperbridge for cryptographically secure, decentralized cross-chain communication between Base and Polkadot.
              </p>
              <p className="font-manrope">
                Unlike traditional bridges, Hyperbridge verifies consensus proofs on-chain, ensuring your assets are never at risk from centralized relayers.
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950">
              Transaction Preview
            </h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Asset</span>
                <span className="font-syne text-sm font-bold text-neutral-950">{selectedTarget.sourceAsset}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Protocol Fee</span>
                <span className="font-syne text-sm font-bold text-neutral-950">0.01 ETH</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2">
                <span className="font-manrope text-sm text-neutral-600">Auto-Deposit</span>
                <span className={`font-syne text-sm font-bold ${autoDeposit ? "text-emerald-600" : "text-neutral-500"}`}>
                  {autoDeposit ? "ENABLED" : "DISABLED"}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
