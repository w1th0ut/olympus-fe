"use client";

import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/core";
import { arbitrumSepolia } from "wagmi/chains";

export const targetChain = arbitrumSepolia;

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: [injected()],
  transports: {
    [targetChain.id]: http(),
  },
  ssr: false,
});
