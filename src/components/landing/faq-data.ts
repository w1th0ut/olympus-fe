export interface FAQItemData {
  question: string;
  answer: string;
}

export const faqData: FAQItemData[] = [
  {
    question: "What is Apollos Finance?",
    answer:
      "Apollos Finance is a DeFi protocol built for boosted liquidity. Our pools use oracle pricing to reduce impermanent loss and prevent LVR (loss versus rebalancing).",
  },
  {
    question: "What are boosted pools?",
    answer:
      "Boosted pools are engineered to optimize yield while protecting LPs from adverse rebalancing and toxic flow.",
  },
  {
    question: "How does Apollos reduce impermanent loss?",
    answer:
      "We align pool pricing with trusted oracles and smooth rebalancing to reduce toxic arbitrage and impermanent loss.",
  },
  {
    question: "What is LVR and why does it matter?",
    answer:
      "LVR (loss versus rebalancing) happens when price updates are captured by arbitrageurs before LPs can adjust. Oracle-priced pools are designed to minimize that loss.",
  },
  {
    question: "Is $APLO a stablecoin?",
    answer:
      "$APLO is not a stablecoin. It is the governance and utility token of the Apollos Finance ecosystem.",
  },
];
