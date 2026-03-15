# Apollos Finance Frontend 🏛️
### The Command Center for Cross-Chain Leveraged Yield

The Apollos Finance frontend is a high-performance web application built with **Next.js 15**, **Wagmi**, and **Framer Motion**. It provides a sophisticated, real-time interface for users to manage leveraged yield positions, monitor protocol health, and bridge assets across chains with unprecedented transparency.

## 🌟 Key Features

### 1. Unified Strategy Dashboard
A single interface to manage complex DeFi operations. Users can deposit, withdraw, and monitor their **afTOKEN** positions across multiple assets (WETH, WBTC, LINK). The dashboard features real-time yield growth charts and a detailed breakdown of the vault's delta-neutral composition.

### 2. AI Guardian Transparency
Apollos Finance demystifies automated DeFi. The frontend integrates directly with the backend's AI engine to display **Human-Readable Guardian Logs**. Users can see exactly why the protocol adjusted fees or rebalanced a position, translated from technical on-chain events into clear English.

### 3. Seamless Cross-Chain UX
Managing cross-chain state is traditionally difficult for users. Apollos solves this with a persistent **Bridge Flow Interface**. Powered by **Chainlink CCIP**, the frontend tracks bridge progress across networks, persisting state in `localStorage` to guide users through the "Store-and-Execute" pattern—even if they close their browser.

### 4. Real-Time Health Monitoring
The **Credit Line Monitor** provides institutional-grade observability. It visualizes **Aave V3 Health Factors**, credit utilization ratios, and historical risk trends using custom SVG charting, ensuring users always know the safety status of their capital.

---

## 🏗️ Technical Architecture

- **Framework:** Next.js 15 (App Router)
- **Web3 Stack:** Wagmi v2, Viem, and RainbowKit
- **State Management:** TanStack Query (React Query) for efficient contract polling and caching.
- **Styling:** Tailwind CSS with a custom Brutalist-inspired design system.
- **Animations:** Framer Motion for high-fidelity interactive elements.
- **Documentation:** Integrated Fumadocs for technical guides.

---

## 🛠️ Technology Stack

- **React 19**
- **TypeScript 5**
- **Wagmi & Viem** (Blockchain Interaction)
- **Lucide React** (Iconography)
- **Radix UI** (Accessible Primitives)
- **Recharts** (Data Visualization)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- [pnpm](https://pnpm.io/) or npm installed.

### Installation
```bash
cd apollos-fe
pnpm install
```

### Configuration
Create a `.env` file based on `.env.example` with the deployed contract addresses and RPC URLs:
```env
NEXT_PUBLIC_ARB_RPC_URL=your_arbitrum_rpc
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_APOLLOS_BE_URL=http://localhost:3001
```

### Development
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

---
*Built with 🔥 to make DeFi smarter, safer, and human-readable.*
