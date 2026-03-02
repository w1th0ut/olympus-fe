"use client";

export function VisualSection() {
  return (
    <section className="relative bg-[#e0e0e0]">
      <div className="flex flex-col items-center text-center px-6 sm:px-8 lg:px-11 pt-6 sm:pt-8 lg:pt-10 translate-y-[-24px]">
        <h2 className="font-syne font-bold text-neutral-950 text-[32px] leading-tight">
          Be smart, use Apollos Finance
        </h2>
        <button className="mt-4 flex items-center rounded-[60px] px-8 py-3 bg-white text-neutral-950 border border-neutral-950 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.35)] transition-colors duration-300 hover:bg-neutral-950 hover:text-white hover:border-white">
          <span className="font-syne font-bold text-lg">Enter Apollos</span>
        </button>
      </div>

      <div className="mt-4 w-full">
        <img
          src="/images/Background-section3.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none w-full h-auto object-contain"
        />
      </div>
    </section>
  );
}
