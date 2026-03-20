export interface FAQItemData {
  question: string;
  answer: string;
}

export const faqData: FAQItemData[] = [
  {
    question: "What is Olympus Finance?",
    answer:
      "Olympus Finance is a delta-neutral yield protocol built on Polkadot Hub TestNet. It combines atomic vault execution, adaptive liquidity defense, and backend-operated automation to help LPs manage volatility more safely with production-oriented vault and risk flows.",
  },
  {
    question: "How does Olympus reduce Impermanent Loss (IL)?",
    answer:
      "Olympus uses a 2x leverage structure to pair volatile assets with stablecoin borrowing, which helps offset directional price exposure and smooth the LP payoff curve. This hedge is executed atomically on Polkadot Hub through Olympus contracts.",
  },
  {
    question: "What is LVR and why does it matter?",
    answer:
      "LVR, or Loss-Versus-Rebalancing, is the value leakage LPs suffer when arbitrageurs trade against stale pricing during volatile market moves. Olympus is built to limit that leakage by combining fast market monitoring, adaptive fee logic, and guarded vault behavior so the protocol can react before adverse flow compounds.",
  },
  {
    question: "How does the AI protect my funds?",
    answer:
      "Olympus runs a backend AI Guardian stack that continuously evaluates off-chain prices, volatility shifts, liquidity conditions, and protocol health. When risk conditions worsen, the system can escalate defensive responses such as fee adjustments, rebalance preparation, and alerting logic before market stress turns into avoidable value loss.",
  },
  {
    question: "Can I deposit from other chains?",
    answer:
      "Yes. Olympus supports cross-chain onboarding with Hyperbridge over XCM, including the Base Sepolia to Polkadot Hub TestNet route. Bridged USD.h can be routed into Olympus vault flows on Polkadot Hub.",
  },
];
