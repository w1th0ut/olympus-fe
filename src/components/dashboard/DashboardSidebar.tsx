"use client";

import Link from "next/link";

export interface DashboardNavItem<TKey extends string = string> {
  key: TKey;
  label: string;
  icon: string;
}

interface DashboardSidebarProps<TKey extends string = string> {
  items: DashboardNavItem<TKey>[];
  activeKey: TKey;
  onSelect: (key: TKey) => void;
}

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/Apollos-Finance",
    icon: "/icons/Logo-Github.png",
  },
  {
    label: "X",
    href: "https://x.com",
    icon: "/icons/Logo-X.png",
  },
  {
    label: "Discord",
    href: "https://discord.com",
    icon: "/icons/Logo-Discord.png",
  },
] as const;

export function DashboardSidebar<TKey extends string>({
  items,
  activeKey,
  onSelect,
}: DashboardSidebarProps<TKey>) {
  return (
    <aside className="w-full md:w-[280px] md:sticky md:top-0 md:self-start md:h-screen md:overflow-y-auto md:shrink-0 md:flex md:flex-col bg-[#efefef] border-r border-black/10">
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

      <nav className="px-4 pb-6 md:flex-1">
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

      <div className="px-9 pb-6 pt-4 md:mt-auto">
        <div className="flex items-center justify-between">
          {socialLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className="inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-105"
            >
              <img src={item.icon} alt={item.label} className="h-9 w-9 object-contain" />
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}