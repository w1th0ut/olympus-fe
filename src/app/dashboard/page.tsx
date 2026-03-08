"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BridgeSection } from "@/components/dashboard/BridgeSection";
import { DexPoolsSection } from "@/components/dashboard/DexPoolsSection";
import { EarnSection } from "@/components/dashboard/EarnSection";
import { LendBorrowMonitorSection } from "@/components/dashboard/LendBorrowMonitorSection";
import { MyBalancesSection } from "@/components/dashboard/MyBalancesSection";

const sectionMeta = {
  balances: {
    title: "My Balances",
    description: "Manage your portfolio",
  },
  earn: {
    title: "Earn",
    description: "Market volatility is your yield",
  },
  pools: {
    title: "DEX Pools",
    description: "Explore Uniswap liquidity pools",
  },
  "lend-borrow": {
    title: "Lend & Borrow",
    description: "Aave Lending Market Overview",
  },
  bridge: {
    title: "Bridge",
    description: "Bridge assets across networks via CCIP Chainlink",
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

function DashboardPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const tabParam = searchParams.get("tab");
  const activeKey: DashboardSectionKey = isDashboardSectionKey(tabParam)
    ? tabParam
    : "balances";
  const active = sectionMeta[activeKey];

  useEffect(() => {
    if (activeKey === "bridge") {
      return;
    }
    if (chainId === arbitrumSepolia.id || isSwitchPending) {
      return;
    }

    void switchChainAsync({ chainId: arbitrumSepolia.id }).catch(() => {
      // User can reject wallet switch request.
    });
  }, [activeKey, chainId, isSwitchPending, switchChainAsync]);

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

        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-12">
          <DashboardHeader title={active.title} description={active.description} activeSection={activeKey} />

          {activeKey === "earn" ? <EarnSection /> : null}
          {activeKey === "balances" ? <MyBalancesSection /> : null}
          {activeKey === "pools" ? <DexPoolsSection /> : null}
          {activeKey === "lend-borrow" ? <LendBorrowMonitorSection /> : null}
          {activeKey === "bridge" ? <BridgeSection /> : null}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e0e0e0]" />}>
      <DashboardPageContent />
    </Suspense>
  );
}

