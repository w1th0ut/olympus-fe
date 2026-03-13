type ExplorerKind = "arb-sepolia" | "base-sepolia";

type ContractRow = {
  label: string;
  envKey: string;
  explorer: ExplorerKind;
};

const EXPLORER_BASE: Record<ExplorerKind, string> = {
  "arb-sepolia": "https://sepolia.arbiscan.io/address/",
  "base-sepolia": "https://sepolia.basescan.org/address/",
};

const SECTIONS: Array<{
  title: string;
  rows: ContractRow[];
}> = [
  {
    title: "Mock Tokens",
    rows: [
      { label: "WETH", envKey: "NEXT_PUBLIC_WETH_ADDRESS", explorer: "arb-sepolia" },
      { label: "WBTC", envKey: "NEXT_PUBLIC_WBTC_ADDRESS", explorer: "arb-sepolia" },
      { label: "LINK", envKey: "NEXT_PUBLIC_LINK_ADDRESS", explorer: "arb-sepolia" },
      { label: "USDC", envKey: "NEXT_PUBLIC_USDC_ADDRESS", explorer: "arb-sepolia" },
    ],
  },
  {
    title: "Core Contracts",
    rows: [
      { label: "Factory", envKey: "NEXT_PUBLIC_FACTORY_ADDRESS", explorer: "arb-sepolia" },
      { label: "WETH Vault", envKey: "NEXT_PUBLIC_WETH_VAULT_ADDRESS", explorer: "arb-sepolia" },
      { label: "WBTC Vault", envKey: "NEXT_PUBLIC_WBTC_VAULT_ADDRESS", explorer: "arb-sepolia" },
      { label: "LINK Vault", envKey: "NEXT_PUBLIC_LINK_VAULT_ADDRESS", explorer: "arb-sepolia" },
      { label: "DataFeedsCache", envKey: "NEXT_PUBLIC_DATA_FEEDS_CACHE_ADDRESS", explorer: "arb-sepolia" },
      { label: "LVR Hook", envKey: "NEXT_PUBLIC_LVR_HOOK_ADDRESS", explorer: "arb-sepolia" },
    ],
  },
  {
    title: "Mock Infrastructure",
    rows: [
      { label: "Uniswap Pool", envKey: "NEXT_PUBLIC_UNISWAP_POOL_ADDRESS", explorer: "arb-sepolia" },
      { label: "Aave Pool", envKey: "NEXT_PUBLIC_AAVE_POOL_ADDRESS", explorer: "arb-sepolia" },
    ],
  },
  {
    title: "CCIP Contracts",
    rows: [
      { label: "Router", envKey: "NEXT_PUBLIC_ROUTER_ADDRESS", explorer: "arb-sepolia" },
      { label: "CCIP Receiver", envKey: "NEXT_PUBLIC_CCIP_RECEIVER_ADDRESS", explorer: "arb-sepolia" },
      { label: "Base CCIP-BnM", envKey: "NEXT_PUBLIC_BASE_CCIP_BNM_ADDRESS", explorer: "base-sepolia" },
      { label: "Source Router", envKey: "NEXT_PUBLIC_SOURCE_ROUTER_ADDRESS", explorer: "base-sepolia" },
    ],
  },
];

function isAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

function AddressCell({ envKey, explorer }: { envKey: string; explorer: ExplorerKind }) {
  const value = process.env[envKey];
  if (!isAddress(value)) {
    return <span className="text-sm text-neutral-500">Not set</span>;
  }

  return (
    <a href={`${EXPLORER_BASE[explorer]}${value}`} target="_blank" rel="noreferrer">
      {value}
    </a>
  );
}

function ContractSection({ title, rows }: { title: string; rows: ContractRow[] }) {
  return (
    <>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Contract</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>
                <AddressCell envKey={row.envKey} explorer={row.explorer} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function SmartContractsFromEnv() {
  return (
    <>
      {SECTIONS.map((section) => (
        <ContractSection key={section.title} title={section.title} rows={section.rows} />
      ))}
    </>
  );
}
