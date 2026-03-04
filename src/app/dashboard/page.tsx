"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EarnSection } from "@/components/dashboard/EarnSection";
import { LendBorrowMonitorSection } from "@/components/dashboard/LendBorrowMonitorSection";
import { PlaceholderSection } from "@/components/dashboard/PlaceholderSection";

const sectionMeta = {
  balances: {
    title: "My Balances",
    description: "Manage your balances",
  },
  earn: {
    title: "Earn",
    description: "Market volatility is your yield",
  },
  pools: {
    title: "DEX Pools",
    description: "Explore liquidity pools",
  },
  "lend-borrow": {
    title: "Lend & Borrow",
    description: "Aave V3 Lending Market Overview",
  },
  bridge: {
    title: "Bridge",
    description: "Bridge assets across networks",
  },
} as const;

type DashboardSectionKey = keyof typeof sectionMeta;

const navItems: DashboardNavItem<DashboardSectionKey>[] = [
  {
    key: "balances",
    label: "My Balances",
    icon: "/icons/Logo-Balances.png",
  },
  {
    key: "earn",
    label: "Earn",
    icon: "/icons/Logo-Earn.png",
  },
  {
    key: "pools",
    label: "DEX Pools",
    icon: "/icons/Logo-Pools.png",
  },
  {
    key: "lend-borrow",
    label: "Lend & Borrow",
    icon: "/icons/Logo-Borrow.png",
  },
  {
    key: "bridge",
    label: "Bridge",
    icon: "/icons/Logo-Bridge.png",
  },
];

function isDashboardSectionKey(value: string | null): value is DashboardSectionKey {
  return (
    value === "balances" ||
    value === "earn" ||
    value === "pools" ||
    value === "lend-borrow" ||
    value === "bridge"
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeKey: DashboardSectionKey = isDashboardSectionKey(tabParam)
    ? tabParam
    : "balances";
  const active = sectionMeta[activeKey];

  const handleSelect = (key: DashboardSectionKey) => {
    if (key === activeKey) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#e0e0e0]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <DashboardSidebar items={navItems} activeKey={activeKey} onSelect={handleSelect} />

        <main className="flex-1 px-6 sm:px-8 lg:px-12 py-8">
          <DashboardHeader title={active.title} description={active.description} />

          {activeKey === "earn" ? <EarnSection /> : null}
          {activeKey === "balances" ? <PlaceholderSection title="My Balances" /> : null}
          {activeKey === "pools" ? <PlaceholderSection title="DEX Pools" /> : null}
          {activeKey === "lend-borrow" ? <LendBorrowMonitorSection /> : null}
          {activeKey === "bridge" ? <PlaceholderSection title="Bridge" /> : null}
        </main>
      </div>
    </div>
  );
}