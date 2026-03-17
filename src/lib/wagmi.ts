"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { targetChain } from "./chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "REPLACE_WITH_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: "Olympus Finance",
  projectId: walletConnectProjectId,
  chains: [targetChain],
  transports: {
    [targetChain.id]: http(
      process.env.NEXT_PUBLIC_POLKADOT_HUB_RPC_URL ??
        targetChain.rpcUrls.default.http[0],
    ),
  },
  ssr: false,
});
