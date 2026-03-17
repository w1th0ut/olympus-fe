# Olympus Finance Frontend

The Olympus Finance frontend is a Next.js application for the Polkadot Hub TestNet deployment of Olympus. It focuses on three core assets, WETH, WBTC, and DOT, and presents the protocol through an Olympus-native dashboard backed by the Express worker.

## Architecture

- Network: Polkadot Hub TestNet
- Vault assets: WETH, WBTC, DOT
- Backend data source: Pyth Hermes, synchronized by `olympus-be`
- Lending execution layer: OlympusLend
- Swap execution layer: OlympusSwap
- Bridge UX: simulated Polkadot XCM flow through backend APIs

The current frontend intentionally reads market prices and workflow activity from the backend because the on-chain oracle and cache contracts are not active on the latest Polkadot Hub deployment yet.

## Dashboard sections

- `My Balances`: wallet balances, faucet access, vault positions, and backend activity
- `Earn`: vault metrics, deposit and withdraw flows, backend market prices, and guardian events
- `DEX Pools`: OlympusSwap pool reserves, pricing, and quote diagnostics
- `Credit Line`: OlympusLend liquidity, debt, utilization, and vault health
- `Bridge`: simulated XCM lifecycle for the Olympus MVP narrative

Hydration may appear in descriptive roadmap copy, but the live EVM execution path remains inside Olympus-controlled mock contracts so the demo stays deterministic.

## Environment variables

Use `.env.example` as the source of truth.

Required runtime values:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_POLKADOT_HUB_RPC_URL=https://services.polkadothub-rpc.com/testnet
NEXT_PUBLIC_OLYMPUS_BE_URL=http://localhost:3001
```

The contract addresses in `.env.example` already match the latest deployed Olympus core contracts on Polkadot Hub TestNet.

Optional values:

- `NEXT_PUBLIC_DATA_FEEDS_CACHE_ADDRESS`
- `NEXT_PUBLIC_WETH_ORACLE_ADDRESS`
- `NEXT_PUBLIC_WBTC_ORACLE_ADDRESS`
- `NEXT_PUBLIC_DOT_ORACLE_ADDRESS`

These are set to the zero address for now because the on-chain oracle and cache layer is not live yet.

## Development

Install dependencies:

```bash
cd olympus-fe
pnpm install
```

Run the frontend:

```bash
pnpm dev
```

Run the type check:

```bash
pnpm check
```

## Backend dependency

For the full dashboard experience, run the backend in parallel:

```bash
cd ../olympus-be
npm run dev:api
npm run dev:polkadot-hub
```
