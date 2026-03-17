export interface FAQItemData {
  question: string;
  answer: string;
}

export const faqData: FAQItemData[] = [
  {
    question: "What is Olympus Finance?",
    answer:
      "Olympus Finance is a next-generation yield protocol built on Polkadot Hub TestNet. We act as a \"smart hedge\" fund for your liquidity. Unlike standard AMMs, Olympus uses a unique leverage strategy to neutralize Impermanent Loss and integrates Gemini AI via Backend AI Guardian Workflows to protect your profit from arbitrage bots (LVR). It's the smarter, safer way to provide liquidity on Hydration (DEX).",
  },
  {
    question: "How does Olympus reduce Impermanent Loss (IL)?",
    answer:
      "We use a 2x Leverage Strategy. Instead of just depositing your own assets, our Vault borrows stablecoins (USDC) from Hydration (Lend) to pair with your volatile assets (ETH/BTC/DOT). This mechanism balances your price exposure, creating a \"linearized yield\" curve. Essentially, you get the benefits of earning trading fees without worrying about your asset ratio changing drastically when the market moves.",
  },
  {
    question: "What is LVR and why does it matter?",
    answer:
      "LVR (Loss-Versus-Rebalancing) is the \"invisible tax\" that Liquidity Providers pay to arbitrage bots during market volatility. When prices crash on Pyth Network Oracle Data Feeds, bots race to trade against your stale liquidity on-chain, stealing your value. Olympus matters because we block this. Our AI Guardian detects volatility and triggers our Hooks to raise fees instantly, forcing bots to back off so the profit stays with you.",
  },
  {
    question: "How does the AI protect my funds?",
    answer:
      "We utilize Backend AI Guardian Workflows powered by Gemini AI as an automated \"Risk Analyst\". This system monitors off-chain market data 24/7. If it detects high volatility or a market crash, the AI calculates a risk score and instructs our smart contracts to enable defensive measures—such as increasing swap fees up to 50%—to prevent predatory trading before it happens.",
  },
  {
    question: "Can I deposit from other parachains?",
    answer:
      "Yes! You don't need to manually bridge funds. Olympus integrates Polkadot XCM (Cross-Consensus Message Format). You can simply send USDC from supported chains and our protocol will automatically \"zap\" your funds into the Olympus Vault on Polkadot Hub TestNet in a single transaction. It's seamless and hassle-free.",
  },
];
