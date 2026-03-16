"use client";

import { useRef } from "react";
import { motion, type MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  staggerContainer,
  staggerItem,
  wordContainer,
  wordItem,
  floatOrb,
  floatOrbSlow,
} from "@/components/landing/animations";
import { HeaderSection } from "@/components/landing/HeaderSection";

interface HeroSectionProps {
  heroImageY: MotionValue<number>;
}

function RippleButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple-circle";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
    onClick?.();
  };

  return (
    <button ref={btnRef} onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

const headlineLines = [
  ["The", "Cross-Chain"],
  ["LVR-Protected"],
  ["Linearized", "Yield", "Protocol"],
];

export function HeroSection({ heroImageY }: HeroSectionProps) {
  const router = useRouter();

  return (
    <section className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Floating orb blobs */}
      <motion.div
        className="orb w-[380px] h-[380px] bg-neutral-400/30 top-16 right-[5%] z-0"
        variants={floatOrb}
        animate="animate"
      />
      <motion.div
        className="orb w-[260px] h-[260px] bg-neutral-300/40 top-1/2 right-[22%] z-0"
        variants={floatOrbSlow}
        animate="animate"
      />
      <motion.div
        className="orb w-[180px] h-[180px] bg-white/25 bottom-32 left-[12%] z-0"
        variants={floatOrb}
        animate="animate"
      />

      {/* Background Image - Michelangelo's David with Parallax */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ y: heroImageY }}
      >
        <div className="relative h-full w-full">
          <motion.img
            src="/images/Background-figma.webp"
            alt="Michelangelo's David"
            className="absolute h-[80%] sm:h-[103%] w-auto object-cover object-center sm:object-left-top right-[-20%] sm:right-[-10%] top-[25%] sm:top-[14%] min-w-[120%] sm:min-w-[60%]"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
          />

          {/* Periodic Glitch Layer (RGB Split effect) */}
          <motion.img
            src="/images/Background-figma.webp"
            alt=""
            className="absolute h-[80%] sm:h-[103%] w-auto object-cover object-center sm:object-left-top right-[-20%] sm:right-[-10%] top-[25%] sm:top-[14%] min-w-[120%] sm:min-w-[60%] mix-blend-screen opacity-0"
            animate={{
              opacity: [0, 0.8, 0, 0.5, 0],
              x: [0, -10, 10, -5, 0],
              filter: [
                "hue-rotate(0deg) brightness(1)",
                "hue-rotate(90deg) brightness(1.5)",
                "hue-rotate(-90deg) brightness(1.2)",
                "hue-rotate(0deg) brightness(1)",
              ],
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              repeatDelay: 4.6,
              ease: "easeInOut",
            }}
          />
        </div>
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
              {["Linearized", "No LVR", "Anti-MEV"].map((item) => (
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

            {/* Main Headline — word-by-word blur reveal */}
            <motion.h1
              className="font-playfair font-bold italic text-neutral-950 text-[24px] sm:text-[32px] lg:text-[56px] leading-[1.1] mb-3 lg:mb-4"
              variants={wordContainer}
              initial="hidden"
              animate="visible"
            >
              {headlineLines.map((line, li) => (
                <span key={li} className="block">
                  {line.map((word, wi) => (
                    <motion.span
                      key={wi}
                      className="inline-block mr-[0.25em]"
                      variants={wordItem}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="font-manrope font-light text-neutral-950 text-lg sm:text-xl lg:text-2xl leading-relaxed mb-6 lg:mb-8 max-w-[500px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Engineered pools that reduce impermanent loss and prevent LVR on
              Arbitrum Chain.
            </motion.p>

            {/* CTA Button — ripple */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="mb-4 lg:mb-6"
            >
              <RippleButton
                onClick={() => router.push("/dashboard?tab=earn")}
                className="group relative overflow-hidden bg-[#111111] text-white border border-neutral-950 rounded px-8 sm:px-12 py-5 sm:py-6 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0 translate-x-full bg-white transition-transform duration-500 ease-out group-hover:translate-x-0"
                />
                <span className="relative z-10 font-syne font-bold text-2xl sm:text-[32px] transition-colors duration-500 group-hover:text-neutral-950">
                  Invest Now
                </span>
              </RippleButton>
            </motion.div>
          </div>
        </main>
      </div>
    </section>
  );
}
