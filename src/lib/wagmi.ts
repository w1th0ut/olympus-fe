"use client";

import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { arbitrumSepolia, baseSepolia } from "wagmi/chains";

export const targetChain = arbitrumSepolia;

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, baseSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARB_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  },
  ssr: false,
});
