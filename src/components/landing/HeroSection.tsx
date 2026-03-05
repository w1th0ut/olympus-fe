"use client";

import { motion, type MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/components/landing/animations";
import { HeaderSection } from "@/components/landing/HeaderSection";

interface HeroSectionProps {
  heroImageY: MotionValue<number>;
}

export function HeroSection({ heroImageY }: HeroSectionProps) {
  const router = useRouter();
  return (
    <section className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Background Image - Michelangelo's David with Parallax */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ y: heroImageY }}
      >
        <motion.img
          src="/images/Background-figma.webp"
          alt="Michelangelo's David"
          className="absolute h-[103%] w-auto object-cover object-left-top"
          style={{
            right: "-10%",
            top: "14%",
            minWidth: "60%",
          }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
      </motion.div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        <HeaderSection />

        {/* Main Content */}
        <main className="px-6 sm:px-8 lg:px-11 pt-6 sm:pt-8 lg:pt-10 flex-1">
          <div className="max-w-[686px]">
            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap gap-4 sm:gap-6 lg:gap-11 mb-4 lg:mb-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[
                "Linearized",
                "No LVR",
                "Anti-MEV",
              ].map((item) => (
                <motion.button
                  key={item}
                  className="bg-white rounded-[60px] w-[140px] sm:w-[160px] lg:w-[180px] py-3 sm:py-4 shadow-[0px_12px_12px_0px_rgba(0,0,0,0.50)] border border-black flex items-center justify-center"
                  variants={staggerItem}
                  whileHover={{
                    scale: 1.08,
                    boxShadow: "0px 18px 25px 0px rgba(0,0,0,0.40)",
                    y: -5,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-syne font-bold text-neutral-950 text-xl sm:text-2xl">
                    {item}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              className="font-playfair font-bold italic text-neutral-950 text-[24px] sm:text-[32px] lg:text-[56px] leading-[1.1] mb-3 lg:mb-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                The Cross-Chain
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.75 }}
              >
                LVR-Protected
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                Linearized Yield Protocol
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="font-manrope font-light text-neutral-950 text-lg sm:text-xl lg:text-2xl leading-relaxed mb-6 lg:mb-8 max-w-[500px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              Engineered pools that reduce impermanent loss and prevent LVR on Arbitrum Chain.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              type="button"
              onClick={() => router.push("/dashboard?tab=earn")}
              className="group relative overflow-hidden bg-[#111111] text-white border border-neutral-950 rounded px-8 sm:px-12 py-5 sm:py-6 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)] mb-4 lg:mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 translate-x-full bg-white transition-transform duration-500 ease-out group-hover:translate-x-0"
              />
              <span className="relative z-10 font-syne font-bold text-2xl sm:text-[32px] transition-colors duration-500 group-hover:text-neutral-950">
                Invest Now
              </span>
            </motion.button>
          </div>
        </main>
      </div>
    </section>
  );
}
