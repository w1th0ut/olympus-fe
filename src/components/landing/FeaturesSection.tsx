"use client";

import { motion, type MotionValue } from "framer-motion";
import { fadeInRight } from "@/components/landing/animations";
import { AnimatedSection } from "@/components/landing/AnimatedSection";

interface FeaturesSectionProps {
  sectionImageY: MotionValue<number>;
}

export function FeaturesSection({ sectionImageY }: FeaturesSectionProps) {
  return (
    <section className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Background Image - Greek Statue with Parallax */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ y: sectionImageY }}
      >
        <img
          src="/images/Background-section2.webp"
          alt="Greek Statue"
          className="absolute h-[105%] w-auto object-cover"
          style={{
            left: "0",
            top: "-3%",
          }}
        />
      </motion.div>

      {/* Features Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-11 py-16">
        {/* Right-aligned content */}
        <div className="ml-auto w-full max-w-[500px] lg:mr-[10%] space-y-16 lg:space-y-20">
          {/* Linear Yield Section */}
          <AnimatedSection>
            <motion.div
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
            >
              <motion.h2
                className="font-syne font-extrabold text-black text-3xl sm:text-4xl lg:text-[40px]"
                whileHover={{ x: 10 }}
                transition={{ duration: 0.3 }}
              >
                Linear Yield
              </motion.h2>
              <p className="font-manrope font-light text-neutral-950 text-xl sm:text-2xl">
                Using a 2x Leverage Strategy from Aave to neutralize volatile asset price exposure.
              </p>
              <motion.button
                className="bg-black/25 text-neutral-950 border border-neutral-950 rounded px-8 py-5 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)] transition-colors duration-300 hover:bg-white hover:text-neutral-950 hover:border-neutral-950"
              >
                <span className="font-syne font-semibold text-xl sm:text-2xl">
                  Start Earning
                </span>
              </motion.button>
            </motion.div>
          </AnimatedSection>

          {/* Prevent LVR Section */}
          <AnimatedSection>
            <motion.div
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
            >
              <motion.h2
                className="font-syne font-extrabold text-black text-3xl sm:text-4xl lg:text-[40px]"
                whileHover={{ x: 10 }}
                transition={{ duration: 0.3 }}
              >
                Prevent LVR
              </motion.h2>
              <p className="font-manrope font-light text-neutral-950 text-xl sm:text-2xl">
                Chainlink Workflows to detect market volatility via Uniswap V4 Hooks.
              </p>
              <motion.button
                className="bg-black/25 text-neutral-950 border border-neutral-950 rounded px-8 py-5 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)] transition-colors duration-300 hover:bg-white hover:text-neutral-950 hover:border-neutral-950"
              >
                <span className="font-syne font-semibold text-xl sm:text-2xl">
                  See in Action
                </span>
              </motion.button>
            </motion.div>
          </AnimatedSection>

          {/* Anti-MEV Bot Section */}
          <AnimatedSection>
            <motion.div
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
            >
              <motion.h2
                className="font-syne font-extrabold text-black text-3xl sm:text-4xl lg:text-[40px]"
                whileHover={{ x: 10 }}
                transition={{ duration: 0.3 }}
              >
                Anti-MEV Bot
              </motion.h2>
              <p className="font-manrope font-light text-neutral-950 text-xl sm:text-2xl">
                Restricted deposit so only ApollosVault can add liquidity.
              </p>
              <motion.button
                className="bg-black/25 text-neutral-950 border border-neutral-950 rounded px-8 py-5 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)] transition-colors duration-300 hover:bg-white hover:text-neutral-950 hover:border-neutral-950"
              >
                <span className="font-syne font-semibold text-xl sm:text-2xl">
                  See Pools
                </span>
              </motion.button>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

