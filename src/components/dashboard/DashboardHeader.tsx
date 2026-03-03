"use client";

interface DashboardHeaderProps {
  title: string;
  description: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-syne font-bold text-neutral-950 text-3xl sm:text-4xl">
          {title}
        </h1>
        <p className="font-manrope font-light text-neutral-700 text-base sm:text-lg">
          {description}
        </p>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-3 self-start rounded-[16px] border border-neutral-950 bg-white px-5 py-2 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.25)]"
      >
        <img src="/icons/Logo-Wallet.png" alt="" className="h-5 w-5 object-contain" />
        <span className="font-syne font-bold text-neutral-950 text-sm sm:text-base">
          Connect Wallet
        </span>
      </button>
    </div>
  );
}
