"use client";

import Link from "next/link";

export interface DashboardNavItem {
  key: string;
  label: string;
  icon: string;
}

interface DashboardSidebarProps {
  items: DashboardNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function DashboardSidebar({ items, activeKey, onSelect }: DashboardSidebarProps) {
  return (
    <aside className="w-full md:w-[280px] bg-[#efefef] border-r border-black/10">
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/images/Logo-figma.webp"
            alt="Apollos Finance Logo"
            className="h-12 w-auto object-contain"
          />
          <div className="flex flex-col -space-y-1">
            <span className="font-playfair font-bold text-neutral-950 text-2xl leading-none">
              APOLLOS
            </span>
            <span className="font-playfair font-bold text-neutral-950 text-base italic leading-tight">
              Finance
            </span>
          </div>
        </Link>
      </div>

      <nav className="px-4 pb-6">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left font-syne font-bold text-neutral-950 transition-colors ${
                isActive ? "bg-black/10" : "hover:bg-black/5"
              }`}
            >
              <img src={item.icon} alt="" className="h-5 w-5 object-contain" />
              <span className="text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
