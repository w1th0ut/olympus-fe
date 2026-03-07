import { type Address } from "viem";

function addr(value: string | undefined, fallback: Address): Address {
  if (!value) return fallback;
  if (/^0x[a-fA-F0-9]{40}$/.test(value)) return value as Address;
  return fallback;
}

export const apollosAddresses = {
  weth: addr(process.env.NEXT_PUBLIC_WETH_ADDRESS, "0x3457e70a80A4c4Fa4e30bE9ce7bBC4be74469D43"),
  wbtc: addr(process.env.NEXT_PUBLIC_WBTC_ADDRESS, "0xD478c56A954E6c112970A1E2CD7012d16A367E37"),
  link: addr(process.env.NEXT_PUBLIC_LINK_ADDRESS, "0x1f7306896330cB998FB8C096090157CCD9158c0d"),
  usdc: addr(process.env.NEXT_PUBLIC_USDC_ADDRESS, "0x3107dF3CdD0A38D1ca213A733B5027424B20d45E"),
  factory: addr(process.env.NEXT_PUBLIC_FACTORY_ADDRESS, "0x428e870468d47af76b8B40aC4309615b4818b6dE"),
  vaultWeth: addr(process.env.NEXT_PUBLIC_WETH_VAULT_ADDRESS, "0x17A5dFe165A33247A2115C753e782D2A0F1d3fA3"),
  vaultWbtc: addr(process.env.NEXT_PUBLIC_WBTC_VAULT_ADDRESS, "0xEc41Ea83381eF2ad79D39334b9E93381a98fD66D"),
  vaultLink: addr(process.env.NEXT_PUBLIC_LINK_VAULT_ADDRESS, "0x1BA4d12D5eEc20d7710EeDa60946F65101fa0610"),
  router: addr(process.env.NEXT_PUBLIC_ROUTER_ADDRESS, "0xC317dfCb50F5259Bada826135DdDd5f88Fb8f570"),
  ccipReceiver: addr(process.env.NEXT_PUBLIC_CCIP_RECEIVER_ADDRESS, "0xebCAa26a9aF31758f65777e523aA248B1E4C0fD7"),
  uniswapPool: addr(process.env.NEXT_PUBLIC_UNISWAP_POOL_ADDRESS, "0xf2FE0E306CFEFa76031c5A36843eDBa47740aa21"),
  aavePool: addr(process.env.NEXT_PUBLIC_AAVE_POOL_ADDRESS, "0x21Cf62E67C48AB84235cEa440D50cf732E284500"),
  lvrHook: addr(process.env.NEXT_PUBLIC_LVR_HOOK_ADDRESS, "0x5Ac4eeE6E533Febd8B8820485Dd378015259D936"),
  baseUsdc: addr(process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS, "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  sourceRouter: addr(process.env.NEXT_PUBLIC_SOURCE_ROUTER_ADDRESS, "0x11c808Fe95C8D8dC85d2f2C3deDCd6c44a03Ab97"),
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
