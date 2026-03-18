import { defineChain } from "viem";
import { arbitrum } from "wagmi/chains";

export const polkadotHubTestnet = defineChain({
  id: 420420417,
  name: "Polkadot Hub TestNet",
  network: "polkadot-hub-testnet",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://services.polkadothub-rpc.com/testnet"],
    },
    public: {
      http: ["https://services.polkadothub-rpc.com/testnet"],
    },
  },
  blockExplorers: {
    default: {
      name: "Polkadot Hub Explorer",
      url: "https://blockscout-testnet.polkadot.io",
    },
  },
  testnet: true,
});

export const targetChain = polkadotHubTestnet;
export const targetExplorerAddressBase = `${targetChain.blockExplorers.default.url}/address`;
export { arbitrum };
