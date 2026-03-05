"use client";

import Link from "next/link";

const wealthSummary = {
  portfolioValue: "$15,420.50",
  lifetimeEarnings: "$120.21",
  averageApy: "12.5%",
  averageHealth: "2.15",
};

const activeVaultPositions = [
  {
    symbol: "afWETH",
    icon: "/icons/Logo-afWETH.png",
    balance: "1.12",
    value: "$12,212.18",
  },
  {
    symbol: "afWBTC",
    icon: "/icons/Logo-afWBTC.png",
    balance: "0.19",
    value: "$6,123.91",
  },
  {
    symbol: "afLINK",
    icon: "/icons/Logo-afLINK.png",
    balance: "102.12",
    value: "$1,001.12",
  },
] as const;

export function MyBalancesSection() {
  return (
    <div className="mt-8 space-y-7">
      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Wealth Summary</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Portfolio Value</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-black/20 bg-[#f5f5f5]">
                <img src="/icons/Logo-Wallet.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <p className="font-syne text-4xl font-bold leading-none text-neutral-950">
                  {wealthSummary.portfolioValue}
                </p>
                <p className="mt-2 font-manrope text-base text-neutral-600">Across all vaults</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Lifetime Earnings</p>
            <div className="mt-4">
              <p className="font-syne text-4xl font-bold leading-none text-emerald-500">
                {wealthSummary.lifetimeEarnings}
              </p>
              <p className="mt-2 font-manrope text-base text-neutral-600">Auto Compound</p>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <p className="font-syne text-xl font-bold text-neutral-950">Average APY & Health</p>
            <div className="mt-4 flex items-center gap-6">
              <p className="font-syne text-4xl font-bold leading-none text-neutral-950">
                {wealthSummary.averageApy}
              </p>
              <span className="h-14 w-px bg-black/25" />
              <p className="font-syne text-4xl font-bold leading-none text-emerald-500">
                {wealthSummary.averageHealth}
              </p>
            </div>
          </article>
        </div>
      </section>

      <div className="h-[3px] w-full rounded-full bg-black/30" />

      <section className="space-y-4">
        <h2 className="font-syne text-xl font-bold text-neutral-950 sm:text-2xl">Portfolio Details</h2>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Active Vault Positions</h3>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[1.7fr_0.9fr_1fr_0.8fr] px-3 pb-2">
                  <span className="font-manrope text-base text-neutral-700">Asset</span>
                  <span className="font-manrope text-base text-neutral-700">Balances</span>
                  <span className="font-manrope text-base text-neutral-700">Values</span>
                  <span className="text-right font-manrope text-base text-neutral-700">Action</span>
                </div>

                <div className="h-px bg-black/25" />

                <div className="space-y-1 py-2">
                  {activeVaultPositions.map((position) => (
                    <div
                      key={position.symbol}
                      className="grid grid-cols-[1.7fr_0.9fr_1fr_0.8fr] items-center px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <img src={position.icon} alt="" className="h-9 w-9 rounded-full object-contain" />
                        <span className="font-syne text-lg font-bold text-neutral-950">{position.symbol}</span>
                      </div>
                      <span className="font-syne text-lg font-bold text-neutral-950">{position.balance}</span>
                      <span className="font-syne text-lg font-bold text-neutral-950">{position.value}</span>
                      <div className="flex justify-end">
                        <Link
                          href="/dashboard?tab=earn"
                          className="rounded-md bg-neutral-800 px-4 py-1.5 font-syne text-base font-bold text-white shadow-[0px_6px_10px_0px_rgba(0,0,0,0.20)] transition-colors hover:bg-neutral-700"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/15 bg-white p-5 shadow-[0px_12px_18px_0px_rgba(0,0,0,0.10)]">
            <h3 className="font-syne text-lg font-bold text-neutral-950 sm:text-xl">Recent Activity</h3>
            <div className="mt-4 min-h-[330px] rounded-xl border border-dashed border-black/10 bg-black/[0.03] p-4">
              <p className="font-manrope text-sm text-neutral-500">No recent activity yet.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
