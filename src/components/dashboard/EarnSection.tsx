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
          <div key={stat.label} className="text-neutral-950">
            <p className="font-manrope font-light text-sm text-neutral-700">{stat.label}</p>
            <p className="font-syne font-bold text-lg sm:text-xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_0.8fr] px-4 pb-2 text-xs font-syne font-bold text-neutral-700">
            <span>Asset</span>
            <span>APY</span>
            <span>TVL</span>
            <span>Capacity</span>
            <span className="text-right">Earn</span>
          </div>
          <div className="h-px bg-black/20" />
          {earnMarkets.map((market) => (
            <div key={market.symbol}>
              <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_0.8fr] items-center px-4 py-4">
                <div className="flex items-center gap-3">
                  <img src={market.icon} alt="" className="h-8 w-8 object-contain" />
                  <span className="font-syne font-bold text-neutral-950">{market.symbol}</span>
                </div>
                <span className="font-syne font-bold text-neutral-950">{market.apy}</span>
                <div>
                  <p className="font-syne font-bold text-neutral-950">{market.tvlPrimary}</p>
                  <p className="font-manrope text-sm text-neutral-600">{market.tvlSecondary}</p>
                </div>
                <div>
                  <span className="font-syne font-bold text-neutral-950">{market.capacity}</span>
                  <div className="mt-2 h-2 w-full max-w-[120px] rounded-full bg-black/20">
                    <div
                      className="h-2 rounded-full bg-neutral-950"
                      style={{ width: `${market.capacityValue}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-md bg-[#111111] px-5 py-2 text-xs font-syne font-bold text-white shadow-[0px_6px_10px_0px_rgba(0,0,0,0.35)]"
                  >
                    Deposit
                  </button>
                </div>
              </div>
              <div className="h-px bg-black/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
