"use client";

const earnStats = [
  { label: "Total TVL", value: "$4,203,129" },
  { label: "Highest market yield", value: "36.30%" },
  { label: "Active markets", value: "3" },
];

const earnMarkets = [
  {
    symbol: "WETH",
    icon: "/icons/Logo-WETH.png",
    apy: "27.12%",
    tvlPrimary: "8.42k WETH",
    tvlSecondary: "$17.67M",
    capacity: "100% (FILLED)",
    capacityValue: 100,
  },
  {
    symbol: "WBTC",
    icon: "/icons/Logo-WBTC.png",
    apy: "36.30%",
    tvlPrimary: "512.65 WBTC",
    tvlSecondary: "$3.67M",
    capacity: "100% (FILLED)",
    capacityValue: 100,
  },
  {
    symbol: "LINK",
    icon: "/icons/Logo-LINK.png",
    apy: "27.12%",
    tvlPrimary: "1.12m LINK",
    tvlSecondary: "$10.04M",
    capacity: "92.25%",
    capacityValue: 92.25,
  },
];

export function EarnSection() {
  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {earnStats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]"
          >
            <p className="font-manrope text-sm text-neutral-600">{stat.label}</p>
            <p className="mt-1 font-syne text-2xl font-bold text-neutral-950">{stat.value}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr] px-4 pb-2 text-xs font-syne font-bold text-neutral-700">
              <span>Asset</span>
              <span>APY</span>
              <span>TVL</span>
              <span>Capacity</span>
            </div>
            <div className="h-px bg-black/20" />

            {earnMarkets.map((market) => (
              <div key={market.symbol}>
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr] items-center px-4 py-4 transition-colors cursor-pointer hover:bg-black/[0.03]">
                  <div className="flex items-center gap-3">
                    <img src={market.icon} alt="" className="h-8 w-8 object-contain" />
                    <span className="font-syne text-lg font-bold text-neutral-950">{market.symbol}</span>
                  </div>

                  <span className="font-syne text-lg font-bold text-neutral-950">{market.apy}</span>

                  <div>
                    <p className="font-syne text-lg font-bold text-neutral-950">{market.tvlPrimary}</p>
                    <p className="font-manrope text-sm text-neutral-600">{market.tvlSecondary}</p>
                  </div>

                  <div>
                    <span className="font-syne text-lg font-bold text-neutral-950">{market.capacity}</span>
                    <div className="mt-2 h-2 w-full max-w-[120px] rounded-full bg-black/20">
                      <div
                        className="h-2 rounded-full bg-neutral-950"
                        style={{ width: `${market.capacityValue}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="h-px bg-black/20" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

