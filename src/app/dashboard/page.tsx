"use client";

import { useState } from "react";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EarnSection } from "@/components/dashboard/EarnSection";
import { PlaceholderSection } from "@/components/dashboard/PlaceholderSection";

const navItems: DashboardNavItem[] = [
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
    description: "Borrow and lend assets",
  },
  bridge: {
    title: "Bridge",
    description: "Bridge assets across networks",
  },
} as const;

export default function DashboardPage() {
  const [activeKey, setActiveKey] = useState<keyof typeof sectionMeta>("balances");
  const active = sectionMeta[activeKey] ?? sectionMeta.balances;

  return (
    <div className="min-h-screen bg-[#e0e0e0]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <DashboardSidebar items={navItems} activeKey={activeKey} onSelect={setActiveKey} />

        <main className="flex-1 px-6 sm:px-8 lg:px-12 py-8">
          <DashboardHeader title={active.title} description={active.description} />

          {activeKey === "earn" ? <EarnSection /> : null}
          {activeKey === "balances" ? <PlaceholderSection title="My Balances" /> : null}
          {activeKey === "pools" ? <PlaceholderSection title="DEX Pools" /> : null}
          {activeKey === "lend-borrow" ? <PlaceholderSection title="Lend & Borrow" /> : null}
          {activeKey === "bridge" ? <PlaceholderSection title="Bridge" /> : null}
        </main>
      </div>
    </div>
  );
}
