import { formatUnits } from "viem";

export const olympusSwapPoolConfig = {
  "weth-usdc": {
    symbol: "WETH",
    reserveBase: "24.3K",
    reserveQuote: "69.2M",
    fallbackPrice: 2660,
    volumeRatio: 0.1,
  },
  "wbtc-usdc": {
    symbol: "WBTC",
    reserveBase: "347.6",
    reserveQuote: "58.4M",
    fallbackPrice: 67414.74,
    volumeRatio: 0.07,
  },
  "dot-usdc": {
    symbol: "DOT",
    reserveBase: "2.1M",
    reserveQuote: "33.4M",
    fallbackPrice: 8.4,
    volumeRatio: 0.05,
  },
} as const;

export const olympusSwapPoolIdBySymbol = {
  WETH: "weth-usdc",
  WBTC: "wbtc-usdc",
  DOT: "dot-usdc",
} as const;

export function parseCompactAmount(value: string) {
  const match = value.match(/([\d.,]+)\s*([KMBT]?)/i);
  if (!match) {
    return 0;
  }

  const numeric = Number.parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  const unit = match[2]?.toUpperCase() ?? "";
  const multiplier =
    unit === "K" ? 1_000 : unit === "M" ? 1_000_000 : unit === "B" ? 1_000_000_000 : unit === "T" ? 1_000_000_000_000 : 1;

  return numeric * multiplier;
}

export function resolveOlympusSwapPoolMetrics({
  reserveBaseRaw,
  reserveQuoteRaw,
  baseDecimals,
  poolId,
}: {
  reserveBaseRaw: bigint;
  reserveQuoteRaw: bigint;
  baseDecimals: number;
  poolId: keyof typeof olympusSwapPoolConfig;
}) {
  const config = olympusSwapPoolConfig[poolId];
  const reserveBaseAmountOnchain = Number(formatUnits(reserveBaseRaw, baseDecimals));
  const reserveQuoteAmountOnchain = Number(formatUnits(reserveQuoteRaw, 6));
  const reserveBaseAmount =
    reserveBaseAmountOnchain > 0 ? reserveBaseAmountOnchain : parseCompactAmount(config.reserveBase);
  const reserveQuoteAmount =
    reserveQuoteAmountOnchain > 0 ? reserveQuoteAmountOnchain : parseCompactAmount(config.reserveQuote);
  const poolPriceUsd =
    reserveBaseAmount > 0 ? reserveQuoteAmount / reserveBaseAmount : config.fallbackPrice;
  const tvlUsd =
    reserveBaseAmount > 0 ? reserveBaseAmount * poolPriceUsd + reserveQuoteAmount : 0;
  const volumeUsd = tvlUsd * config.volumeRatio;

  return {
    reserveBaseAmount,
    reserveQuoteAmount,
    poolPriceUsd,
    tvlUsd,
    volumeUsd,
  };
}
