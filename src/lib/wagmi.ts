"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { arbitrumSepolia, baseSepolia } from "wagmi/chains";

export const targetChain = arbitrumSepolia;

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "REPLACE_WITH_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "Apollos Finance",
  projectId: walletConnectProjectId,
  chains: [arbitrumSepolia, baseSepolia],
  transports: {
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARB_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  },
  ssr: false,
});
