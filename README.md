# 🏔️ Olympus Finance Frontend

The Olympus Finance frontend is a high-performance **Next.js** dashboard built for the **Polkadot Hub TestNet**. It provides a professional-grade DeFi interface for interacting with Olympus leveraged vaults, monitoring autonomous risk management, and executing secure cross-chain transfers via Hyperbridge.

---

## ✨ Key Features

- **🚀 Leveraged Yield Dashboard**: High-performance monitoring for capital-efficient yield strategies. Users can track WETH, WBTC, and DOT vault performance, APY trends, Total Value Locked (TVL), and individual position growth with professional-grade transparency.
- **🧠 Agentic AI Integration**: A built-in **AI Copilot** powered by **Google Gemini** and the **Polkadot Agent Kit**. This "Protocol Brain" provides context-aware guidance, translates complex technical risk logs into human-readable narratives, and prepares Substrate-native actions like cross-chain swaps and balance checks directly from the UI.
- **🌉 Hyperbridge Connectivity**: Cryptographically secure cross-chain asset movement powered by **Hyperbridge**. Supports seamless teleportation from **Base Sepolia** to **Polkadot Hub** with a unique **Auto-Zap** mechanism that automatically deposits assets into the user's selected vault upon arrival.
- **📊 Real-time Risk Metrics**: An institutional-grade risk management suite displaying **VaR (Value at Risk)** with 95% confidence, **NAV (Net Asset Value)** via a Hybrid Valuation system, and real-time **Health Factors** for every position to ensure maximum protocol stability.
- **🛡️ Autonomous Activity Feed**: A transparent, live stream of all protocol management actions. Displays real-time activities of the **Autonomous Guardians**, including dynamic LVR fee adjustments, automated vault rebalancing, and emergency circuit breaker triggers.

---

## 🏗️ Architecture

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Web3 Stack**: Wagmi + Viem + ConnectKit
- **AI Layer**: Direct integration with `olympus-agent`
- **Network**: Polkadot Hub TestNet (EVM-compatible Substrate)
- **Data Engine**: Synchronized market data from `olympus-be` (Pyth Hermes + Backend State)
- **Lending execution layer**: OlympusLend
- **Swap execution layer**: OlympusSwap
- **Vault assets**: WETH, WBTC, DOT

---

## 📊 Dashboard Sections

### 1. 💰 My Balances
The user's mission control center.
- **Portfolio Overview**: Displays wallet balances for WETH, WBTC, DOT, and USDC.
- **Position Tracking**: Tracks active vault shares (afTokens) and their current base asset value.
- **Quick Faucet**: Direct access to mock assets for seamless testnet onboarding.
- **Global Activity**: A high-level view of protocol-wide events.

### 2. 📈 Earn
The core yield generation engine.
- **Vault Execution**: One-click deposit and withdrawal into 2x leveraged strategies.
- **Market Metrics**: Real-time display of APY, TVL, and total vault assets.
- **Guardian Status**: Shows current volatility levels and dynamic fee adjustments from the `LVRHook`.
- **Hybrid NAV**: Professional charts showing the backend-synchronized vault valuation.

### 3. 🌊 DEX Pools
Transparency layer for the underlying AMM (`OlympusSwap`).
- **Reserve Monitoring**: Real-time visibility into token0 and token1 reserves.
- **Price Analysis**: Comparison between AMM spot prices and backend oracle prices.
- **Divergence Tracking**: Visual cues for LVR risk and arbitrage opportunities.

### 4. 💳 Credit Line
Monitoring layer for the protocol's leverage backbone (`OlympusLend`).
- **Debt Profile**: Tracks total USDC borrowed by vaults to maintain leverage.
- **Utilization & Health**: Protocol-wide health factors and liquidation buffers.
- **Risk Brief**: Summarized **VaR** metrics explaining the statistical safety of the current credit delegation.

### 5. 🌉 Hyperbridge (Cross-Chain)
Secure teleportation from the EVM ecosystem to Polkadot.
- **Base -> Polkadot Hub**: Bridge `USD.h` from Base Sepolia with decentralized verification.
- **Auto-Zap/Deposit**: Special logic that automatically swaps and deposits assets into the selected vault upon arrival on Polkadot.
- **Subsidized Experience**: UI-driven "Zero-Fee" bridging where the protocol covers relayer costs for the user.

### 🤖 AI Copilot (Drawer)
The protocol's interactive "Brain" accessible from any section.
- **Context-Aware Guidance**: Automatically suggests actions based on the current view (e.g., "Risk Brief" in Earn).
- **Tool Execution**: Allows users to run Substrate-native tools (balance checks, swaps) via the AI Agent.
- **Narrative Summaries**: Transforms complex technical logs into easy-to-understand protocol updates.

---

## 🔐 Environment Variables

The frontend relies on the following environment variables. Ensure they are configured in `.env` before running.

### 📡 Core Runtime
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_POLKADOT_HUB_RPC_URL`
- `NEXT_PUBLIC_OLYMPUS_BE_URL`
- `NEXT_PUBLIC_OLYMPUS_AGENT_URL`

### 🏛️ Smart Contract Addresses
- `NEXT_PUBLIC_WETH_ADDRESS`
- `NEXT_PUBLIC_WBTC_ADDRESS`
- `NEXT_PUBLIC_DOT_ADDRESS`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_FACTORY_ADDRESS`
- `NEXT_PUBLIC_ROUTER_ADDRESS`
- `NEXT_PUBLIC_OLYMPUS_SWAP_ADDRESS`
- `NEXT_PUBLIC_OLYMPUS_LEND_ADDRESS`
- `NEXT_PUBLIC_LVR_HOOK_ADDRESS`
- `NEXT_PUBLIC_WETH_VAULT_ADDRESS`
- `NEXT_PUBLIC_WBTC_VAULT_ADDRESS`
- `NEXT_PUBLIC_DOT_VAULT_ADDRESS`

### 🌉 Hyperbridge & Cross-Chain
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_BASE_BRIDGE_ADDRESS`
- `NEXT_PUBLIC_POLKADOT_RECEIVER_ADDRESS`
- `NEXT_PUBLIC_BASE_USDH_ADDRESS`

### 🔮 Analytics & Oracle IDs
- `NEXT_PUBLIC_DATA_FEEDS_CACHE_ADDRESS`
- `NEXT_PUBLIC_WETH_ORACLE_ADDRESS`
- `NEXT_PUBLIC_WBTC_ORACLE_ADDRESS`
- `NEXT_PUBLIC_DOT_ORACLE_ADDRESS`
- `NEXT_PUBLIC_WETH_NAV_ID`
- `NEXT_PUBLIC_WBTC_NAV_ID`
- `NEXT_PUBLIC_DOT_NAV_ID`
- `NEXT_PUBLIC_WETH_VAR_ID`
- `NEXT_PUBLIC_WBTC_VAR_ID`
- `NEXT_PUBLIC_DOT_VAR_ID`

---

## 🏃 Run

### Install:
```bash
pnpm install
```

### Start Development:
```bash
pnpm dev
```

### Build & Type Check:
```bash
pnpm check
pnpm build
```

### Backend dependency

For the full dashboard experience, run the backend in parallel:
```bash
cd ../olympus-be
npm run dev:api
npm run dev:polkadot-hub
```
---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
