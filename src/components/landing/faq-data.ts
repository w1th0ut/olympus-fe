export interface FAQItemData {
  question: string;
  answer: string;
}

export const faqData: FAQItemData[] = [
  {
    question: "What is Olympus Finance?",
    answer:
      "Olympus Finance is a delta-neutral yield protocol built on Polkadot Hub TestNet. It combines atomic vault execution, adaptive liquidity defense, and backend-operated automation to help LPs manage volatility more safely. The current MVP executes locally on Polkadot Hub for one-block deployment, while its market experience and roadmap are aligned with future Hydration connectivity through Polkadot XCM.",
  },
  {
    question: "How does Olympus reduce Impermanent Loss (IL)?",
    answer:
      "Olympus uses a 2x leverage structure to pair volatile assets with stablecoin borrowing, which helps offset directional price exposure and smooth the LP payoff curve. In the current MVP this hedge is executed atomically on Polkadot Hub through Olympus contracts, while the longer-term architecture is designed to connect to Hydration lending routes through XCM.",
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
    question: "Can I deposit from other parachains?",
    answer:
      "The current MVP presents cross-parachain onboarding through a Polkadot XCM simulation layer. Today, atomic deployment and vault execution happen on Polkadot Hub TestNet, while native cross-parachain settlement to downstream venues such as Hydration is part of the next integration phase.",
  },
];
