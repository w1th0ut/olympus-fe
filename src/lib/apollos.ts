import { type Address } from "viem";

function requiredAddr(envName: string, value: string | undefined): Address {
  if (!value) {
    throw new Error(`Missing required env: ${envName}`);
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`Invalid address for env ${envName}: ${value}`);
  }
  return value as Address;
}

export const apollosAddresses = {
  weth: requiredAddr("NEXT_PUBLIC_WETH_ADDRESS", process.env.NEXT_PUBLIC_WETH_ADDRESS),
  wbtc: requiredAddr("NEXT_PUBLIC_WBTC_ADDRESS", process.env.NEXT_PUBLIC_WBTC_ADDRESS),
  link: requiredAddr("NEXT_PUBLIC_LINK_ADDRESS", process.env.NEXT_PUBLIC_LINK_ADDRESS),
  usdc: requiredAddr("NEXT_PUBLIC_USDC_ADDRESS", process.env.NEXT_PUBLIC_USDC_ADDRESS),
  factory: requiredAddr("NEXT_PUBLIC_FACTORY_ADDRESS", process.env.NEXT_PUBLIC_FACTORY_ADDRESS),
  vaultWeth: requiredAddr(
    "NEXT_PUBLIC_WETH_VAULT_ADDRESS",
    process.env.NEXT_PUBLIC_WETH_VAULT_ADDRESS,
  ),
  vaultWbtc: requiredAddr(
    "NEXT_PUBLIC_WBTC_VAULT_ADDRESS",
    process.env.NEXT_PUBLIC_WBTC_VAULT_ADDRESS,
  ),
  vaultLink: requiredAddr(
    "NEXT_PUBLIC_LINK_VAULT_ADDRESS",
    process.env.NEXT_PUBLIC_LINK_VAULT_ADDRESS,
  ),
  router: requiredAddr("NEXT_PUBLIC_ROUTER_ADDRESS", process.env.NEXT_PUBLIC_ROUTER_ADDRESS),
  ccipReceiver: requiredAddr(
    "NEXT_PUBLIC_CCIP_RECEIVER_ADDRESS",
    process.env.NEXT_PUBLIC_CCIP_RECEIVER_ADDRESS,
  ),
  uniswapPool: requiredAddr(
    "NEXT_PUBLIC_UNISWAP_POOL_ADDRESS",
    process.env.NEXT_PUBLIC_UNISWAP_POOL_ADDRESS,
  ),
  aavePool: requiredAddr("NEXT_PUBLIC_AAVE_POOL_ADDRESS", process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS),
  lvrHook: requiredAddr("NEXT_PUBLIC_LVR_HOOK_ADDRESS", process.env.NEXT_PUBLIC_LVR_HOOK_ADDRESS),
  baseCcipBnm: requiredAddr(
    "NEXT_PUBLIC_BASE_CCIP_BNM_ADDRESS",
    process.env.NEXT_PUBLIC_BASE_CCIP_BNM_ADDRESS,
  ),
  sourceRouter: requiredAddr(
    "NEXT_PUBLIC_SOURCE_ROUTER_ADDRESS",
    process.env.NEXT_PUBLIC_SOURCE_ROUTER_ADDRESS,
  ),
} as const;

export const ccipSelectors = {
  arbitrumSepolia: BigInt("3478487238524512106"),
  baseSepolia: BigInt("10344971235874465080"),
} as const;

export type VaultKey = "afWETH" | "afWBTC" | "afLINK";

export const vaultMarkets: Array<{
  key: VaultKey;
  symbol: "WETH" | "WBTC" | "LINK";
  icon: string;
  afIcon: string;
  vaultAddress: Address;
  tokenAddress: Address;
  decimals: number;
}> = [
  {
    key: "afWETH",
    symbol: "WETH",
    icon: "/icons/Logo-WETH.png",
    afIcon: "/icons/Logo-afWETH.png",
    vaultAddress: apollosAddresses.vaultWeth,
    tokenAddress: apollosAddresses.weth,
    decimals: 18,
  },
  {
    key: "afWBTC",
    symbol: "WBTC",
    icon: "/icons/Logo-WBTC.png",
    afIcon: "/icons/Logo-afWBTC.png",
    vaultAddress: apollosAddresses.vaultWbtc,
    tokenAddress: apollosAddresses.wbtc,
    decimals: 8,
  },
  {
    key: "afLINK",
    symbol: "LINK",
    icon: "/icons/Logo-LINK.png",
    afIcon: "/icons/Logo-afLINK.png",
    vaultAddress: apollosAddresses.vaultLink,
    tokenAddress: apollosAddresses.link,
    decimals: 18,
  },
];

export function toPoolKey(tokenA: Address, tokenB: Address) {
  const [currency0, currency1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];

  return {
    currency0,
    currency1,
    fee: 3000,
    tickSpacing: 60,
    hooks: apollosAddresses.lvrHook,
  } as const;
}
