"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { uniswapAbi, vaultAbi } from "@/lib/olympus-abi";
import { olympusAddresses, toPoolKey, vaultMarkets } from "@/lib/olympus";
import { targetChain } from "@/lib/chains";

const SHARE_PRICE_DECIMALS = 18;
const APY_ANNUALIZATION_WINDOW_DAYS = 30;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Animated number counter that counts up from 0 to target when in view. */
function AnimatedCounter({
  value,
  format,
  duration = 1.8,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayed, setDisplayed] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!isInView || value === 0) return;
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = (ts - startTime.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(eased * value);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [isInView, value, duration]);

  return <span ref={ref}>{format(displayed)}</span>;
}

export function ProtocolStatsSection() {
  const contracts = vaultMarkets.flatMap((market) => [
    {
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "totalAssets" as const,
      chainId: targetChain.id,
    },
    {
      address: olympusAddresses.uniswapPool,
      abi: uniswapAbi,
      functionName: "getPoolStateByKey" as const,
      args: [toPoolKey(market.tokenAddress, olympusAddresses.usdc)],
      chainId: targetChain.id,
    },
    {
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "getSharePrice" as const,
      chainId: targetChain.id,
    },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { refetchInterval: 15000 },
  });

  const { treasuryValueUsd, highestApy } = useMemo(() => {
    let treasuryValueUsd = 0;
    let highestApy = 0;

    vaultMarkets.forEach((market, index) => {
      const offset = index * 3;
      const totalAssetsRaw =
        (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
      const poolState = data?.[offset + 1]?.result as
        | { reserve0: bigint; reserve1: bigint }
        | undefined;
      const sharePriceRaw =
        (data?.[offset + 2]?.result as bigint | undefined) ?? BigInt(0);

      const assetAmount = Number(formatUnits(totalAssetsRaw, market.decimals));
      const isBaseCurrency0 =
        market.tokenAddress.toLowerCase() < olympusAddresses.usdc.toLowerCase();
      const reserveBaseRaw = isBaseCurrency0
        ? (poolState?.reserve0 ?? BigInt(0))
        : (poolState?.reserve1 ?? BigInt(0));
      const reserveUsdcRaw = isBaseCurrency0
        ? (poolState?.reserve1 ?? BigInt(0))
        : (poolState?.reserve0 ?? BigInt(0));
      const reserveBaseAmount = Number(formatUnits(reserveBaseRaw, market.decimals));
      const reserveUsdcAmount = Number(formatUnits(reserveUsdcRaw, 6));
      const usdPrice = reserveBaseAmount > 0 ? reserveUsdcAmount / reserveBaseAmount : 0;
      const usdValue = assetAmount * usdPrice;
      treasuryValueUsd += Number.isFinite(usdValue) ? usdValue : 0;

      const sharePrice = Number(
        formatUnits(sharePriceRaw, SHARE_PRICE_DECIMALS),
      );
      const cumulativeReturnPct =
        Number.isFinite(sharePrice) && sharePrice > 0
          ? Math.max(0, (sharePrice - 1) * 100)
          : 0;
      const apyValue = Math.max(
        0,
        Math.min(
          999,
          cumulativeReturnPct * (365 / APY_ANNUALIZATION_WINDOW_DAYS),
        ),
      );
      highestApy = Math.max(highestApy, apyValue);
    });

    return { treasuryValueUsd, highestApy };
  }, [data]);

  return (
    <section className="relative -mt-12 px-6 sm:-mt-16 sm:px-8 lg:-mt-20 lg:px-11">
      <div className="relative mx-auto max-w-6xl">
        <motion.img
          src="/icons/Triangle.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-36 z-10 w-24 -translate-y-1/2 sm:-left-44 sm:right-auto sm:w-40 lg:w-56"
          initial={{ opacity: 0, y: 40, rotate: 10 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />        <motion.div
          className="relative z-0 rounded-[28px] border border-black/15 bg-white px-6 py-6 shadow-[0px_20px_30px_0px_rgba(0,0,0,0.15)] sm:px-8 sm:py-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="font-syne text-2xl font-bold text-neutral-950 sm:text-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Protocol Stats
          </motion.h2>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Treasury Value — animated counter */}
            {[
              {
                label: "Treasury Value",
                node: isLoading ? (
                  <span className="text-neutral-400">Loading...</span>
                ) : (
                  <AnimatedCounter
                    value={treasuryValueUsd}
                    format={(n) => formatUsd(n)}
                  />
                ),
                delay: 0.2,
              },
              {
                label: "Highest APY",
                node: (
                  <AnimatedCounter
                    value={highestApy}
                    format={(n) => `${n.toFixed(2)}%`}
                  />
                ),
                delay: 0.3,
              },
              {
                label: "Operating Since",
                node: <span>February 2026</span>,
                delay: 0.4,
              },
            ].map(({ label, node, delay }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay }}
                whileHover={{ scale: 1.03 }}
              >
                <p className="font-manrope text-sm text-neutral-700">{label}</p>
                <p className="mt-2 font-syne text-2xl font-bold text-neutral-950 sm:text-3xl">
                  {node}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
