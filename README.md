# Apollos Finance Frontend 🏛️
### The Command Center for Cross-Chain Leveraged Yield

The Apollos Finance frontend is a high-performance web application built with **Next.js 15**, **Wagmi**, and **Framer Motion**. It provides a sophisticated, real-time interface for users to manage leveraged yield positions, monitor protocol health, and bridge assets across chains with institutional-grade transparency.

## 🌟 Key Features (The Apollos Edge)

### 1. Unified Cross-Chain Strategy Dashboard ⚙️
Manage complex leveraged operations from a single "Command Center." Users can deposit and monitor **afTOKEN** positions (WETH, WBTC, LINK) with real-time yield tracking. The dashboard abstracts the complexity of Aave V3 credit delegation and Uniswap V4 liquidity provision into a seamless user experience.

### 2. Predictive Risk Analytics (VaR) 📊
Unlike standard dashboards that only show past performance, Apollos provides **Forward-Looking Risk Assessment**. Powered by Chainlink CRE, the frontend displays a real-time **Value at Risk (VaR)** score. This gives users an institutional-grade percentage estimate of potential hourly losses, calculated using historical simulation and current leverage factors.

### 3. AI-Powered "Guardian Logs" 🧠
Apollos demystifies DeFi automation. Every strategic move—whether it's a rebalance, a fee adjustment, or an emergency pause—is recorded in the **Guardian Logs**. Using **Gemini AI**, technical blockchain events are translated into natural language narratives, ensuring users always know the "Why" behind protocol decisions.

### 4. Active LVR Protection (Uniswap V4 Hooks) ⚔️
Apollos is at the forefront of AMM evolution. The protocol implements custom **Uniswap V4 Hooks** to protect Liquidity Providers from **Loss-Versus-Rebalancing (LVR)**. The frontend visualizes when the "Reactive Defender" workflow triggers dynamic fee increases to discourage toxic arbitrage during high market volatility.

### 5. Decentralized Intelligence Hub (Chainlink CRE) 🛰️
The protocol is powered by a decentralized "Off-Chain Brain" using **Chainlink Runtime Environment (CRE)**. This architecture ensures that critical logic—such as the **Autonomous Auditor**, **Accountant**, and **Strategist**—runs with node-level reliability and consensus, moving beyond centralized bots used by traditional protocols.

### 6. Persistent "Store-and-Execute" Bridge Flow 📡
Powered by **Chainlink CCIP**, Apollos handles cross-chain state with a persistent interface. The "Auto-Zap" feature allows users to bridge USDC and instantly deposit into leveraged vaults. The UI tracks and persists the bridge status in `localStorage`, guiding users through the multi-step process even across browser sessions.

---

## 🏗️ Technical Architecture

- **Framework**: Next.js 15 (App Router) with React 19.
- **Web3 Stack**: Wagmi v2, Viem, and RainbowKit.
- **State Management**: TanStack Query for efficient blockchain polling.
- **Styling**: Tailwind CSS v4 with a custom Brutalist design system.
- **Animations**: Framer Motion for high-fidelity interactive elements (including 3D Tilt and Digital RGB Glitch effects).
- **Visualization**: Recharts for historical TVL, APY, and Risk trend analysis.

---

## 🛠 Technology Stack

- **Framework**: Next.js 15
- **Language**: TypeScript 5
- **Blockchain**: Wagmi & Viem
- **Icons**: Lucide React
- **UI Components**: Radix UI & Shadcn
- **Visuals**: Framer Motion

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- [pnpm](https://pnpm.io/) installed.

### Installation
```bash
cd apollos-fe
pnpm install
```

### Configuration
Update the `.env` file with your specific contract addresses and IDs:
```env
NEXT_PUBLIC_ARB_RPC_URL=...
NEXT_PUBLIC_DATA_FEEDS_CACHE_ADDRESS=0x4D370021f2b5253f8085B64a6B882265B68A024e
# DataFeed IDs (Decimal)
NEXT_PUBLIC_WETH_VAR_ID=107253457905186060015569424072619445204683515814529241517409241510340786950426
```

### Execution
```bash
pnpm dev
```

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with 🔥 by Apollos Finance Team to make DeFi smarter, safer, and human-readable.*
