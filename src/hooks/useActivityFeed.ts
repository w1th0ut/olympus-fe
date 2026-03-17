"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchActivityFeed } from "@/lib/backend";

export type ActivityFeedItem = {
  id?: string;
  reason?: string;
  event?: string;
  observedAtMs?: number;
  poolTag?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type UseActivityFeedOptions = {
  limit?: number;
  poolTag?: string;
  refreshIntervalMs?: number;
};

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
  const { limit = 8, poolTag, refreshIntervalMs = 15_000 } = options;
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (poolTag) {
      params.set("poolTag", poolTag);
    }
    return params;
  }, [limit, poolTag]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!cancelled) {
          setError("");
        }
        const response = await fetchActivityFeed(query);
        if (cancelled) return;
        setItems(response.items ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load activity feed");
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
  }, [query, refreshIntervalMs]);

  return {
    items,
    isLoading,
    error,
  };
}
