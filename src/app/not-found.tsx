import Link from "next/link";

const navItems = ["Security", "Docs", "Transparency", "Governance"];

const marqueeText =
  "APOLLOS FINANCE • STAKING • POOLS • LENDING • APOLLOS FINANCE • STAKING • POOLS • LENDING • APOLLOS FINANCE • STAKING • POOLS • LENDING •";

export default function NotFound() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#e0e0e0]">
      <img
        src="/images/Background-404.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 bottom-0 w-[85%] sm:w-[70%] lg:w-[60%] max-w-none h-auto select-none"
      />

      <div className="relative z-10 flex h-full flex-col">
        <header className="w-full px-6 sm:px-8 lg:px-11 py-2 lg:py-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <Link href="/" className="flex items-center gap-2 pt-2">
              <img
                src="/images/Logo-figma.webp"
                alt="Apollos Finance Logo"
                className="w-[50px] h-[62px] sm:w-[60px] sm:h-[75px] lg:w-[78px] lg:h-[97px] object-contain"
              />
              <div className="flex flex-col -space-y-2 lg:-space-y-4">
                <span className="font-playfair font-bold text-neutral-950 text-3xl sm:text-4xl lg:text-[64px] leading-none tracking-tight">
                  APOLLOS
                </span>
                <span className="font-playfair font-bold text-neutral-950 text-lg sm:text-xl lg:text-[32px] italic leading-tight pl-0.5">
                  Finance
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 pt-6">
              {navItems.map((item) => (
                <Link
                  key={item}
                  href={`/#${item.toLowerCase()}`}
                  className="font-manrope font-bold text-neutral-950 text-lg xl:text-xl transition-transform duration-200 hover:scale-105"
                >
                  {item}
                </Link>
              ))}
              <button className="flex items-center gap-3 bg-white rounded-[60px] px-6 py-3 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.50)] border border-neutral-950 transition-transform duration-200 hover:scale-105">
                <span className="font-syne font-bold text-neutral-950 text-lg xl:text-xl">
                  Menu
                </span>
                <span className="relative w-[13px] h-[13px]">
                  <span className="absolute top-1/2 left-0 w-[13px] h-[3px] bg-neutral-950 -translate-y-1/2" />
                  <span className="absolute top-0 left-1/2 w-[3px] h-[13px] bg-neutral-950 -translate-x-1/2" />
                </span>
              </button>
            </nav>

            <button className="lg:hidden flex items-center gap-2 bg-white rounded-[60px] px-4 py-2 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.50)] border border-neutral-950 mt-6 transition-transform duration-200 hover:scale-105">
              <span className="font-syne font-bold text-neutral-950 text-base">Menu</span>
              <span className="relative w-[13px] h-[13px]">
                <span className="absolute top-1/2 left-0 w-[13px] h-[3px] bg-neutral-950 -translate-y-1/2" />
                <span className="absolute top-0 left-1/2 w-[3px] h-[13px] bg-neutral-950 -translate-x-1/2" />
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-start justify-center px-6 sm:px-8 lg:px-11 pt-[10vh] sm:pt-[12vh] lg:pt-[14vh]">
          <div className="max-w-[720px] text-center">
            <h1 className="font-playfair font-bold text-neutral-950 text-4xl sm:text-5xl lg:text-6xl leading-tight">
              Oops, page not found
            </h1>
            <p className="mt-3 mx-auto max-w-[520px] font-manrope font-light text-neutral-700 text-base sm:text-lg">
              The page you are looking for might have been removed, had its name
              changed or is temporarily unavailable.
            </p>
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 h-9 overflow-hidden">
        <div className="flex items-center h-full animate-marquee whitespace-nowrap">
          <span className="font-syne font-medium text-white text-xl px-2">
            {marqueeText}
          </span>
          <span className="font-syne font-medium text-white text-xl px-2">
            {marqueeText}
          </span>
        </div>
      </div>
    </div>
  );
}