"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { chainlinkAggregatorAbi, vaultAbi } from "@/lib/apollos-abi";
import { vaultMarkets } from "@/lib/apollos";

const CHAINLINK_PRICE_DECIMALS = 8;
const SHARE_PRICE_DECIMALS = 18;
const APY_ANNUALIZATION_WINDOW_DAYS = 30;

const chainlinkArbitrumFeeds: Record<"WETH" | "WBTC" | "LINK", `0x${string}`> = {
  WETH: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
  WBTC: "0x6ce185860a4963106506C203335A2910413708e9",
  LINK: "0x86E53CF1B870786351Da77A57575e79CB55812CB",
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProtocolStatsSection() {
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
      address: market.vaultAddress,
      abi: vaultAbi,
      functionName: "getSharePrice" as const,
      chainId: arbitrumSepolia.id,
    },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    allowFailure: true,
    query: {
      refetchInterval: 15000,
    },
  });

  const stats = useMemo(() => {
    let treasuryValueUsd = 0;
    let highestApy = 0;

    vaultMarkets.forEach((market, index) => {
      const offset = index * 3;
      const totalAssetsRaw = (data?.[offset]?.result as bigint | undefined) ?? BigInt(0);
      const latestRoundData = (data?.[offset + 1]?.result as
        | readonly [bigint, bigint, bigint, bigint, bigint]
        | undefined);
      const sharePriceRaw = (data?.[offset + 2]?.result as bigint | undefined) ?? BigInt(0);

      const rawPrice =
        latestRoundData?.[1] && latestRoundData[1] > BigInt(0)
          ? latestRoundData[1]
          : BigInt(0);
      const usdPrice = Number(formatUnits(rawPrice, CHAINLINK_PRICE_DECIMALS));
      const assetAmount = Number(formatUnits(totalAssetsRaw, market.decimals));
      const usdValue = assetAmount * usdPrice;
      treasuryValueUsd += Number.isFinite(usdValue) ? usdValue : 0;

      const sharePrice = Number(formatUnits(sharePriceRaw, SHARE_PRICE_DECIMALS));
      const cumulativeReturnPct =
        Number.isFinite(sharePrice) && sharePrice > 0
          ? Math.max(0, (sharePrice - 1) * 100)
          : 0;
      const apyValue = Math.max(
        0,
        Math.min(999, cumulativeReturnPct * (365 / APY_ANNUALIZATION_WINDOW_DAYS)),
      );
      highestApy = Math.max(highestApy, apyValue);
    });

    return [
      {
        label: "Treasury Value",
        value: isLoading ? "Loading..." : formatUsd(treasuryValueUsd),
      },
      {
        label: "Highest APY",
        value: `${highestApy.toFixed(2)}%`,
      },
      {
        label: "Operating Since",
        value: "February 2026",
      },
    ];
  }, [data, isLoading]);

  return (
    <section className="relative -mt-12 px-6 sm:-mt-16 sm:px-8 lg:-mt-20 lg:px-11">
      <div className="relative mx-auto max-w-6xl">
        <motion.img
          src="/icons/Triangle.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 top-36 z-10 w-32 -translate-y-1/2 sm:-left-44 sm:w-40 lg:w-56"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
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
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <p className="font-manrope text-sm text-neutral-700">{stat.label}</p>
                <p className="mt-2 font-syne text-2xl font-bold text-neutral-950 sm:text-3xl">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
