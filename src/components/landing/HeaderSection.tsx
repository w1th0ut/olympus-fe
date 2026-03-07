"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/landing/animations";

const topNavItems = [
  { label: "Security", href: "https://skynet.certik.com/projects/apollos-finance" },
  { label: "Docs", href: "/docs" },
  { label: "Transparency", href: "/transparency" },
  { label: "Governance", href: "/governance" },
];

const dashboardMenuItems = [
  { label: "My Balances", href: "/dashboard?tab=balances" },
  { label: "Earn", href: "/dashboard?tab=earn" },
  { label: "DEX Pools", href: "/dashboard?tab=pools" },
  { label: "Lend & Borrow", href: "/dashboard?tab=lend-borrow" },
  { label: "Bridge", href: "/dashboard?tab=bridge" },
];

const navLinkVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
};

const navUnderlineVariants = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1 },
};

const menuPanelVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: "easeOut" as const,
      when: "beforeChildren" as const,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.16,
      ease: "easeIn" as const,
      when: "afterChildren" as const,
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: { opacity: 0, y: 6, transition: { duration: 0.12 } },
};

function MenuDropdown({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="w-[min(92vw,320px)] rounded-3xl border border-neutral-950/70 bg-white/95 p-3 shadow-[0px_18px_30px_0px_rgba(0,0,0,0.28)] backdrop-blur-sm"
      variants={menuPanelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.p
        className="px-3 pb-2 font-manrope text-xs font-bold uppercase tracking-[0.2em] text-neutral-500"
        variants={menuItemVariants}
      >
        Dashboard
      </motion.p>

      <motion.ul className="space-y-1">
        {dashboardMenuItems.map((item) => (
          <motion.li key={item.label} variants={menuItemVariants}>
            <Link
              href={item.href}
              onClick={onClose}
              className="block rounded-2xl px-3 py-3 font-manrope text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

export function HeaderSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedDesktop = desktopMenuRef.current?.contains(target);
      const clickedMobile = mobileMenuRef.current?.contains(target);

      if (!clickedDesktop && !clickedMobile) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
          {topNavItems.map((item) => (
            <motion.a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
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

          <div ref={desktopMenuRef} className="relative" data-menu-root>
            <motion.button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 bg-white rounded-[60px] px-6 py-3 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.50)] border border-neutral-950"
              variants={staggerItem}
              whileHover={{
                scale: 1.03,
                boxShadow: "0px 14px 18px 0px rgba(0,0,0,0.36)",
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="font-syne font-bold text-neutral-950 text-lg xl:text-xl">Menu</span>
              <motion.div
                className="relative w-[13px] h-[13px]"
                animate={{ rotate: isMenuOpen ? 45 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="absolute top-1/2 left-0 w-[13px] h-[3px] bg-neutral-950 -translate-y-1/2" />
                <div className="absolute top-0 left-1/2 w-[3px] h-[13px] bg-neutral-950 -translate-x-1/2" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div className="absolute right-0 top-[calc(100%+14px)] z-50 origin-top-right">
                  <MenuDropdown onClose={() => setIsMenuOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>

        {/* Mobile Menu Button */}
        <div ref={mobileMenuRef} className="relative lg:hidden mt-6" data-menu-root>
          <motion.button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 bg-white rounded-[60px] px-4 py-2 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.50)] border border-neutral-950"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="font-syne font-bold text-neutral-950 text-base">Menu</span>
            <motion.div
              className="relative w-[13px] h-[13px]"
              animate={{ rotate: isMenuOpen ? 45 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="absolute top-1/2 left-0 w-[13px] h-[3px] bg-neutral-950 -translate-y-1/2" />
              <div className="absolute top-0 left-1/2 w-[3px] h-[13px] bg-neutral-950 -translate-x-1/2" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div className="absolute right-0 top-[calc(100%+12px)] z-50 origin-top-right">
                <MenuDropdown onClose={() => setIsMenuOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
