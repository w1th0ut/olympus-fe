"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useBalance,
  useConnections,
  useDisconnect,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";
import { targetChain } from "@/lib/wagmi";

interface DashboardHeaderProps {
  title: string;
  description: string;
  activeSection?: string;
}

function formatAddress(address?: string) {
  if (!address) {
    return "Wallet Connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function DashboardHeader({ title, description, activeSection }: DashboardHeaderProps) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const walletMenuRef = useRef<HTMLDivElement | null>(null);

  const { address, isConnected } = useAccount();
  const connections = useConnections();
  const { openConnectModal } = useConnectModal();

  const balanceChain = activeSection === "bridge" ? baseSepolia : targetChain;
  const balanceLabel = activeSection === "bridge" ? "ETH Balance (Base)" : "ETH Balance (ARB)";

  const { data: nativeBalance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: balanceChain.id,
    query: {
      enabled: Boolean(address && isConnected),
      refetchInterval: 15_000,
    },
  });

  const { disconnectAsync, error: disconnectError, isPending: isDisconnectPending } = useDisconnect();

  const walletError = disconnectError;
  const explorerBaseUrl = balanceChain.blockExplorers?.default.url;
  const primaryLabel = !isConnected ? "Connect Wallet" : formatAddress(address);

  const clearConnections = async () => {
    if (connections.length === 0) {
      await disconnectAsync();
      return;
    }

    await Promise.allSettled(
      connections.map((connection) => disconnectAsync({ connector: connection.connector })),
    );
  };

  useEffect(() => {
    if (!isConnected) {
      setIsWalletModalOpen(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isWalletModalOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!walletMenuRef.current?.contains(event.target as Node)) {
        setIsWalletModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isWalletModalOpen]);

  const handlePrimaryAction = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    setIsWalletModalOpen((previous) => !previous);
  };

  const handleCopyAddress = async () => {
    if (!address) {
      return;
    }

    await navigator.clipboard.writeText(address);
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1200);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-syne font-bold text-neutral-950 text-3xl sm:text-4xl">{title}</h1>
        <p className="font-manrope font-light text-neutral-700 text-base sm:text-lg">{description}</p>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div ref={walletMenuRef} className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isDisconnectPending || (!isConnected && !openConnectModal)}
            className="inline-flex items-center gap-3 self-start rounded-[16px] border border-neutral-950 bg-white px-5 py-2 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <img src="/icons/Logo-Wallet.png" alt="" className="h-5 w-5 object-contain" />
            <span className="font-syne font-bold text-neutral-950 text-sm sm:text-base">
              {primaryLabel}
            </span>
          </button>

          {isConnected && isWalletModalOpen ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[280px] rounded-2xl border border-black/15 bg-white p-3 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.18)]">
              <p className="font-syne text-sm font-bold text-neutral-950">Wallet</p>
              <p className="mt-1 break-all font-manrope text-xs text-neutral-600">{address}</p>
              <div className="mt-2 rounded-lg border border-black/10 bg-black/[0.02] px-2.5 py-2">
                <p className="font-manrope text-[11px] text-neutral-500">{balanceLabel}</p>
                <p className="font-syne text-sm font-bold text-neutral-900">
                  {isBalanceLoading
                    ? "Loading..."
                    : nativeBalance
                      ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}`
                      : "-"}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="rounded-md border border-black/15 bg-white px-2 py-1.5 font-syne text-xs font-bold text-neutral-800 transition-colors hover:bg-black/[0.03]"
                >
                  {copyState === "copied" ? "Copied" : "Copy"}
                </button>

                {explorerBaseUrl && address ? (
                  <a
                    href={`${explorerBaseUrl}/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-black/15 bg-white px-2 py-1.5 font-syne text-xs font-bold text-neutral-800 transition-colors hover:bg-black/[0.03]"
                  >
                    Explorer
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-md border border-black/10 bg-black/[0.03] px-2 py-1.5 font-syne text-xs font-bold text-neutral-400">
                    Explorer
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  void clearConnections();
                  setIsWalletModalOpen(false);
                }}
                className="mt-2 w-full rounded-md border border-black/20 bg-white px-3 py-2 font-syne text-xs font-bold text-neutral-700 transition-colors hover:bg-black/[0.03]"
              >
                Disconnect
              </button>
            </div>
          ) : null}
        </div>

        {walletError ? <p className="font-manrope text-xs text-red-600">{walletError.message}</p> : null}
      </div>
    </div>
  );
}
