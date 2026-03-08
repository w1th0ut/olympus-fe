import { type Address } from "viem";

function addr(value: string | undefined, fallback: Address): Address {
  if (!value) return fallback;
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return value as Address;
  return fallback;
}

export const apollosAddresses = {
  weth: addr(
    process.env.NEXT_PUBLIC_WETH_ADDRESS,
    "0x0b7F7B47284cF10fB829A94605B6EEeE9a77b651",
  ),
  wbtc: addr(
    process.env.NEXT_PUBLIC_WBTC_ADDRESS,
    "0xA1Fc6bdFcF5aBD5c1DF873351f466AC467575Dce",
  ),
  link: addr(
    process.env.NEXT_PUBLIC_LINK_ADDRESS,
    "0x35d970Ea6C6C81a3DB28C4FBef87dC4eED9422D2",
  ),
  usdc: addr(
    process.env.NEXT_PUBLIC_USDC_ADDRESS,
    "0xD3aE3c10084aF1195845Fd0BCCa5beccBB28753d",
  ),
  factory: addr(
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
    "0x26fF6038f2f4e39dF3d12Bd0b20D86d60c11378b",
  ),
  vaultWeth: addr(
    process.env.NEXT_PUBLIC_WETH_VAULT_ADDRESS,
    "0x578c1b767729D7da8366fbA579e1Cb1Ee3D14E70",
  ),
  vaultWbtc: addr(
    process.env.NEXT_PUBLIC_WBTC_VAULT_ADDRESS,
    "0x6E3B9C1DDD94811C7cA5b7DaA2C6d7B6c20AaA38",
  ),
  vaultLink: addr(
    process.env.NEXT_PUBLIC_LINK_VAULT_ADDRESS,
    "0xf1C471C25120AF71f6F5f962f143D841AA25C4eC",
  ),
  router: addr(
    process.env.NEXT_PUBLIC_ROUTER_ADDRESS,
    "0x106987ae77c0bC127e8168a4a4859d1bFB37D422",
  ),
  ccipReceiver: addr(
    process.env.NEXT_PUBLIC_CCIP_RECEIVER_ADDRESS,
    "0x951Fa17e3588C963f1584472AB3e0d059d5d3683",
  ),
  uniswapPool: addr(
    process.env.NEXT_PUBLIC_UNISWAP_POOL_ADDRESS,
    "0x83E7627A3B1363d73E269847e15b1aE1f29c9705",
  ),
  aavePool: addr(
    process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS,
    "0x4715383F64a391AA1e29672D510f9e1b928af59E",
  ),
  lvrHook: addr(
    process.env.NEXT_PUBLIC_LVR_HOOK_ADDRESS,
    "0x166Cd2bf0c8715478ce96D492E47ef030A881a9A",
  ),
  baseCcipBnm: addr(
    process.env.NEXT_PUBLIC_BASE_CCIP_BNM_ADDRESS,
    "0x88A2d74F47a237a62e7A51cdDa67270CE381555e",
  ),
  sourceRouter: addr(
    process.env.NEXT_PUBLIC_SOURCE_ROUTER_ADDRESS,
    "0xd4AAA8333B6A5408b12510b68bE78bB41edb628E",
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
