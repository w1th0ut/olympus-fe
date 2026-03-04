"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/landing/animations";

const navItems = [
  { label: "Security", href: "/security" },
  { label: "Docs", href: "/docs" },
  { label: "Transparency", href: "/transparency" },
  { label: "Governance", href: "/governance" },
];

const navLinkVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
};

const navUnderlineVariants = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1 },
};

export function HeaderSection() {
  return (
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
          {navItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="font-manrope font-bold text-neutral-950 text-lg xl:text-xl relative pb-2"
              variants={staggerItem}
              initial="rest"
              animate="rest"
              whileHover="hover"
            >
              <motion.span variants={navLinkVariants} className="relative z-10 inline-block">
                {item.label}
              </motion.span>
              <motion.div
                variants={navUnderlineVariants}
                className="absolute left-0 right-0 bottom-0 h-[3px] bg-neutral-950 rounded-full origin-left"
                transition={{ duration: 0.25 }}
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
  );
}
