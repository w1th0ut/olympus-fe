import { baseSepolia, targetChain, targetExplorerAddressBase } from "@/lib/chains";

type ContractRow = {
  label: string;
  envKey: string;
  network?: string;
  explorerAddressBase?: string;
};

const SECTIONS: Array<{
  title: string;
  rows: ContractRow[];
}> = [
  {
    title: "Mock Tokens",
    rows: [
      { label: "WETH", envKey: "NEXT_PUBLIC_WETH_ADDRESS" },
      { label: "WBTC", envKey: "NEXT_PUBLIC_WBTC_ADDRESS" },
      { label: "DOT", envKey: "NEXT_PUBLIC_DOT_ADDRESS" },
      { label: "USDC", envKey: "NEXT_PUBLIC_USDC_ADDRESS" },
    ],
  },
  {
    title: "Core Contracts",
    rows: [
      { label: "Factory", envKey: "NEXT_PUBLIC_FACTORY_ADDRESS" },
      { label: "Router", envKey: "NEXT_PUBLIC_ROUTER_ADDRESS" },
      { label: "OlympusSwap", envKey: "NEXT_PUBLIC_OLYMPUS_SWAP_ADDRESS" },
      { label: "OlympusLend", envKey: "NEXT_PUBLIC_OLYMPUS_LEND_ADDRESS" },
      { label: "LVR Hook", envKey: "NEXT_PUBLIC_LVR_HOOK_ADDRESS" },
      { label: "WETH Vault", envKey: "NEXT_PUBLIC_WETH_VAULT_ADDRESS" },
      { label: "WBTC Vault", envKey: "NEXT_PUBLIC_WBTC_VAULT_ADDRESS" },
      { label: "DOT Vault", envKey: "NEXT_PUBLIC_DOT_VAULT_ADDRESS" },
    ],
  },
  {
    title: "Optional Oracle And Risk Contracts",
    rows: [
      { label: "Data Cache", envKey: "NEXT_PUBLIC_DATA_FEEDS_CACHE_ADDRESS" },
      { label: "WETH Oracle", envKey: "NEXT_PUBLIC_WETH_ORACLE_ADDRESS" },
      { label: "WBTC Oracle", envKey: "NEXT_PUBLIC_WBTC_ORACLE_ADDRESS" },
      { label: "DOT Oracle", envKey: "NEXT_PUBLIC_DOT_ORACLE_ADDRESS" },
    ],
  },
  {
    title: "Bridge And XCM Contracts",
    rows: [
      {
        label: "OlympusBaseBridge",
        envKey: "NEXT_PUBLIC_BASE_BRIDGE_ADDRESS",
        network: baseSepolia.name,
        explorerAddressBase: `${baseSepolia.blockExplorers.default.url}/address`,
      },
      {
        label: "OlympusPolkadotReceiver",
        envKey: "NEXT_PUBLIC_POLKADOT_RECEIVER_ADDRESS",
      },
      {
        label: "Base USD.h",
        envKey: "NEXT_PUBLIC_BASE_USDH_ADDRESS",
        network: baseSepolia.name,
        explorerAddressBase: `${baseSepolia.blockExplorers.default.url}/address`,
      },
    ],
  },
];

function isAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

function AddressCell({
  envKey,
  explorerAddressBase,
}: {
  envKey: string;
  explorerAddressBase?: string;
}) {
  const value = process.env[envKey];
  if (!isAddress(value) || /^0x0{40}$/i.test(value)) {
    return <span className="text-sm text-neutral-500">Not set</span>;
  }

  const href = `${explorerAddressBase ?? targetExplorerAddressBase}/${value}`;

  return (
    <a href={href} target="_blank" rel="noreferrer">
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
            <th>Network</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.network ?? targetChain.name}</td>
              <td>
                <AddressCell
                  envKey={row.envKey}
                  explorerAddressBase={row.explorerAddressBase}
                />
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
