"use client";

import { useRouter } from "next/navigation";
import { motion, type MotionValue } from "framer-motion";
import { clipReveal } from "@/components/landing/animations";

interface FeaturesSectionProps {
  sectionImageY: MotionValue<number>;
}

const features = [
  {
    title: "Linear Yield",
    desc: "Using a 2x Leverage Strategy from Hydration (Lend) to neutralize volatile asset price exposure.",
    btnLabel: "Start Earning",
    href: "/dashboard?tab=earn",
  },
  {
    title: "Prevent LVR",
    desc: "Backend AI Guardian to detect market volatility.",
    btnLabel: "See in Action",
    href: null,
  },
  {
    title: "Anti-MEV Bot",
    desc: "Restricted deposit so only OlympusVault can add liquidity.",
    btnLabel: "See Pools",
    href: "/dashboard?tab=pools",
  },
];

export function FeaturesSection({ sectionImageY }: FeaturesSectionProps) {
  const router = useRouter();

  return (
    <section className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Background Image Container - Reduced image width prominence */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ y: sectionImageY }}
      >
        <img
          src="/images/Background-section2.webp"
          alt="Greek Statue"
          className="absolute h-[100%] w-full object-cover left-[-30%] sm:left-[-15%] md:left-[-10%] lg:left-0 opacity-90"
          style={{ maxWidth: "45%" }} 
        />
      </motion.div>

      {/* Features Content - Expanded text area with tighter vertical alignment */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12">
        {/* Right-aligned content - Significantly tightened spacing */}
        <div className="ml-auto w-full max-w-[650px] lg:mr-[5%] space-y-4 lg:space-y-6">
          {features.map(({ title, desc, btnLabel, href }, i) => (
            <motion.div
              key={title}
              className="space-y-3 p-6 lg:p-8 rounded-[32px] bg-black/40 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-none shadow-2xl sm:shadow-none"
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                duration: 1.2, 
                delay: i * 0.3,
                ease: [0.22, 1, 0.36, 1] 
              }}
            >
              <motion.h2
                className="font-syne font-extrabold text-white sm:text-black text-3xl sm:text-4xl lg:text-[44px] leading-tight"
                whileHover={{ x: 15 }}
                transition={{ duration: 0.4 }}
              >
                {title}
              </motion.h2>
              <p className="font-manrope font-light text-neutral-100 sm:text-neutral-900 text-xl lg:text-2xl leading-relaxed max-w-[700px]">
                {desc}
              </p>
              <motion.button
                type="button"
                onClick={() => href && router.push(href)}
                className="mt-2 w-full sm:w-auto min-w-[240px] flex items-center justify-center bg-white/10 sm:bg-black/25 text-white sm:text-neutral-950 border border-white/20 sm:border-neutral-950 px-10 py-5 shadow-[0px_15px_30px_0px_rgba(0,0,0,0.40)] sm:shadow-[0px_12px_20px_0px_rgba(0,0,0,0.30)] transition-all duration-500 hover:bg-white hover:text-neutral-950 hover:shadow-[0px_20px_40px_0px_rgba(0,0,0,0.50)]"
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-syne font-semibold text-xl sm:text-2xl">
                  {btnLabel}
                </span>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
