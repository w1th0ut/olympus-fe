"use client";

import { motion } from "framer-motion";
import { HeaderSection, Marquee } from "@/components/landing";

const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren" as const,
      staggerChildren: 0.14,
      delayChildren: 0.24,
    },
  },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export default function NotFound() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#e0e0e0]">
      <motion.img
        src="/images/Background-404.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 bottom-0 w-[85%] sm:w-[70%] lg:w-[60%] max-w-none h-auto select-none"
        initial={{ opacity: 0, x: -36, y: 26, scale: 1.05 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.95, ease: "easeOut", delay: 0.2 }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <HeaderSection />

        <main className="flex-1 flex items-start justify-center px-6 sm:px-8 lg:px-11 pt-[10vh] sm:pt-[12vh] lg:pt-[14vh]">
          <motion.div
            className="max-w-[720px] text-center"
            variants={textContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="font-playfair font-bold text-neutral-950 text-4xl sm:text-5xl lg:text-6xl leading-tight"
              variants={textItemVariants}
            >
              Oops, page not found
            </motion.h1>
            <motion.p
              className="mt-3 mx-auto max-w-[520px] font-manrope font-light text-neutral-700 text-base sm:text-lg"
              variants={textItemVariants}
            >
              The page you are looking for might have been removed, had its name
              changed or is temporarily unavailable.
            </motion.p>
          </motion.div>
        </main>
      </div>

      <Marquee />
    </div>
  );
}