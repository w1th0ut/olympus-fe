"use client";

import { useEffect, useState } from "react";
import { fetchBackendMarketPrices, type BackendPriceSnapshot } from "@/lib/backend";

type AssetSymbol = "WETH" | "WBTC" | "DOT";

type MarketPriceState = {
  prices: Partial<Record<AssetSymbol, BackendPriceSnapshot>>;
  updatedAtMs: number;
  isLoading: boolean;
  error: string;
};

export function useBackendMarketPrices(refreshIntervalMs = 30_000): MarketPriceState {
  const [prices, setPrices] = useState<Partial<Record<AssetSymbol, BackendPriceSnapshot>>>({});
  const [updatedAtMs, setUpdatedAtMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!cancelled) {
          setError("");
        }
        const response = await fetchBackendMarketPrices();
        if (cancelled) return;
        setPrices(response.prices);
        setUpdatedAtMs(response.updatedAtMs);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load market prices");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    const intervalHandle = setInterval(() => {
      void load();
    }, refreshIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalHandle);
    };
  }, [refreshIntervalMs]);

  return {
    prices,
    updatedAtMs,
    isLoading,
    error,
  };
}
