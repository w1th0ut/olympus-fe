import { HeaderSection, Marquee } from "@/components/landing";

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
        <HeaderSection />

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

      <Marquee />
    </div>
  );
}
