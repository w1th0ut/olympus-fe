"use client";

import { motion, type MotionValue } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/landing/animations";

interface HeroSectionProps {
  heroImageY: MotionValue<number>;
}

export function HeroSection({ heroImageY }: HeroSectionProps) {
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
        {/* Header/Navbar */}
        <motion.header
          className="w-full px-6 sm:px-8 lg:px-11 py-2 lg:py-3 flex-shrink-0"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex items-start justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 pt-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
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
            </motion.div>

            {/* Navigation */}
            <motion.nav
              className="hidden lg:flex items-center gap-4 xl:gap-6 pt-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {["Security", "Docs", "Transparency", "Governance"].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="font-manrope font-bold text-neutral-950 text-lg xl:text-xl relative overflow-hidden"
                  variants={staggerItem}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="relative z-10">{item}</span>
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-950"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
              <motion.button
                className="flex items-center gap-3 bg-white rounded-[60px] px-6 py-3 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.50)] border border-neutral-950"
                variants={staggerItem}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0px 15px 20px 0px rgba(0,0,0,0.40)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="font-syne font-bold text-neutral-950 text-lg xl:text-xl">
                  Menu
                </span>
                <motion.div
                  className="relative w-[13px] h-[13px]"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute top-1/2 left-0 w-[13px] h-[3px] bg-neutral-950 -translate-y-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-[3px] h-[13px] bg-neutral-950 -translate-x-1/2"></div>
                </motion.div>
              </motion.button>
            </motion.nav>

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden flex items-center gap-2 bg-white rounded-[60px] px-4 py-2 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.50)] border border-neutral-950 mt-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="font-syne font-bold text-neutral-950 text-base">Menu</span>
              <div className="relative w-[13px] h-[13px]">
                <div className="absolute top-1/2 left-0 w-[13px] h-[3px] bg-neutral-950 -translate-y-1/2"></div>
                <div className="absolute top-0 left-1/2 w-[3px] h-[13px] bg-neutral-950 -translate-x-1/2"></div>
              </div>
            </motion.button>
          </div>
        </motion.header>

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
              {["Boosted Pools", "Oracle Pricing", "LVR Shield"].map((item) => (
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
              className="font-playfair font-bold italic text-neutral-950 text-4xl sm:text-5xl lg:text-7xl leading-[1.1] mb-3 lg:mb-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Boosted Liquidity
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                Oracle-Priced Pools
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="font-manrope font-light text-neutral-950 text-lg sm:text-xl lg:text-2xl leading-relaxed mb-6 lg:mb-8 max-w-[500px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              Engineered pools that reduce impermanent loss and prevent LVR with oracle-based
              pricing as the source of truth.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              className="bg-[#111111] text-white border border-neutral-950 rounded px-8 sm:px-12 py-5 sm:py-6 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)] mb-4 lg:mb-6 transition-colors duration-300 hover:bg-white hover:text-neutral-950 hover:border-neutral-950"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <span className="font-syne font-bold text-2xl sm:text-[32px]">
                Invest Now
              </span>
            </motion.button>

            {/* Statistics */}
            <motion.div
              className="flex items-center gap-6 sm:gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <motion.div className="flex flex-col" whileHover={{ scale: 1.05 }}>
                <span className="font-manrope font-light text-neutral-950/60 text-lg sm:text-xl">
                  TVL
                </span>
                <motion.span
                  className="font-manrope font-medium text-neutral-950 text-lg sm:text-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.6 }}
                >
                  $4,203,129
                </motion.span>
              </motion.div>
              <motion.div
                className="w-[1px] h-[54px] bg-black"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              />
              <motion.div className="flex flex-col" whileHover={{ scale: 1.05 }}>
                <span className="font-manrope font-light text-neutral-950/60 text-lg sm:text-xl">
                  CURRENT APY
                </span>
                <motion.span
                  className="font-manrope font-medium text-neutral-950 text-lg sm:text-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.8 }}
                >
                  12.5%
                </motion.span>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </section>
  );
}



