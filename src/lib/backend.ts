export function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_OLYMPUS_BE_URL ?? "").trim().replace(/\/$/, "");
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_OLYMPUS_BE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type BackendPriceSnapshot = {
  asset: "WETH" | "WBTC" | "DOT";
  priceUsd: number;
  answer: string;
  decimals: number;
  feedId: string;
  publishedAtMs: number;
  source: string;
  updatedAtMs: number;
};

export async function fetchBackendMarketPrices() {
  return fetchJson<{
    updatedAtMs: number;
    prices: Partial<Record<"WETH" | "WBTC" | "DOT", BackendPriceSnapshot>>;
  }>("/api/market/prices");
}

export async function fetchActivityFeed(params: URLSearchParams) {
  return fetchJson<{
    items?: Array<{
      id?: string;
      reason?: string;
      event?: string;
      observedAtMs?: number;
      poolTag?: string;
      metadata?: Record<string, string | number | boolean | null>;
    }>;
  }>(`/api/activity-feed?${params.toString()}`);
}

export async function createXcmTransfer(payload: {
  sourceAsset: "WETH" | "WBTC" | "DOT";
  amount: string;
  destination: string;
  parachain?: string;
  note?: string;
}) {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_OLYMPUS_BE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/api/xcm/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<{
    ok: true;
    transfer: {
      id: string;
      status: "queued" | "in_transit" | "completed";
      createdAtMs: number;
      updatedAtMs: number;
      completedAtMs: number | null;
      sourceAsset: "WETH" | "WBTC" | "DOT";
      amount: string;
      destination: string;
      parachain: string;
      note: string;
    };
  }>;
}

export async function fetchXcmTransfer(id: string) {
  return fetchJson<{
    transfer: {
      id: string;
      status: "queued" | "in_transit" | "completed";
      createdAtMs: number;
      updatedAtMs: number;
      completedAtMs: number | null;
      sourceAsset: "WETH" | "WBTC" | "DOT";
      amount: string;
      destination: string;
      parachain: string;
      note: string;
    };
  }>(`/api/xcm/transfers/${id}`);
}
