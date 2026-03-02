"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence, type Variants } from "framer-motion";

/**
 * Apollos Finance Landing Page
 * Design: Classical Greek aesthetic with Michelangelo's David
 * Fonts: Playfair Display (headlines), Syne (buttons/features), Manrope (body)
 * Colors: Light gray background (#e0e0e0), neutral-950 text, white buttons
 * Animations: Scroll-triggered, entrance, hover, parallax effects
 */

// Animation variants with proper typing
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8 }
  }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8 }
  }
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6 }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div 
      ref={ref}
      className="border-b border-neutral-400"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left"
        whileHover={{ x: 10 }}
        transition={{ duration: 0.3 }}
      >
        <span className="font-manrope font-medium text-neutral-950 text-xl sm:text-2xl pr-4">
          {question}
        </span>
        <motion.div 
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-neutral-950 flex items-center justify-center"
          whileHover={{ scale: 1.1, borderColor: "#666" }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-5 h-5 sm:w-6 sm:h-6">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-950 -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/2 w-[2px] h-full bg-neutral-950 -translate-x-1/2"></div>
          </div>
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <p className="font-manrope font-light text-neutral-700 text-lg pr-16 pb-6">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Animated Section Component
function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const containerRef = useRef(null);
  
  // Parallax scroll effects
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, 150]);
  const section2ImageY = useTransform(scrollYProgress, [0.2, 0.6], [0, 100]);

  const faqData = [
    {
      question: "What is Apollos Finance?",
      answer:
        "Apollos Finance is a DeFi protocol built for boosted liquidity. Our pools use oracle pricing to reduce impermanent loss and prevent LVR (loss versus rebalancing).",
    },
    {
      question: "What are boosted pools?",
      answer:
        "Boosted pools are engineered to optimize yield while protecting LPs from adverse rebalancing and toxic flow.",
    },
    {
      question: "How does Apollos reduce impermanent loss?",
      answer:
        "We align pool pricing with trusted oracles and smooth rebalancing to reduce toxic arbitrage and impermanent loss.",
    },
    {
      question: "What is LVR and why does it matter?",
      answer:
        "LVR (loss versus rebalancing) happens when price updates are captured by arbitrageurs before LPs can adjust. Oracle-priced pools are designed to minimize that loss.",
    },
    {
      question: "Is $APLO a stablecoin?",
      answer:
        "$APLO is not a stablecoin. It is the governance and utility token of the Apollos Finance ecosystem.",
    },
  ];

  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.style.willChange = "transform";
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-[#e0e0e0] overflow-x-hidden">
      {/* Section 1 - Hero */}
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
                  whileHover={{ scale: 1.05, boxShadow: "0px 15px 20px 0px rgba(0,0,0,0.40)" }}
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
                <span className="font-syne font-bold text-neutral-950 text-base">
                  Menu
                </span>
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
                {["Boosted Pools", "Oracle Pricing", "LVR Shield"].map((item, index) => (
                  <motion.button
                    key={item}
                    className="bg-white rounded-[60px] w-[140px] sm:w-[160px] lg:w-[180px] py-3 sm:py-4 shadow-[0px_12px_12px_0px_rgba(0,0,0,0.50)] border border-black flex items-center justify-center"
                    variants={staggerItem}
                    whileHover={{ 
                      scale: 1.08, 
                      boxShadow: "0px 18px 25px 0px rgba(0,0,0,0.40)",
                      y: -5
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
                Engineered pools that reduce impermanent loss and prevent LVR
                with oracle-based pricing as the source of truth.
              </motion.p>

              {/* CTA Button */}
              <motion.button 
                className="bg-[#111111] rounded px-8 sm:px-12 py-5 sm:py-6 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)] mb-4 lg:mb-6 relative overflow-hidden group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "16px 16px 20px 0px rgba(0,0,0,0.40)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.4 }}
                />
                <span className="font-syne font-bold text-white text-2xl sm:text-[32px] relative z-10">
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
                <motion.div 
                  className="flex flex-col"
                  whileHover={{ scale: 1.05 }}
                >
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
                <motion.div 
                  className="flex flex-col"
                  whileHover={{ scale: 1.05 }}
                >
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

      {/* Section 2 - Features (Boosted Pools, Oracle Pricing, LVR Shield) */}
      <section className="min-h-screen relative flex flex-col overflow-hidden">
        {/* Background Image - Greek Statue with Parallax */}
        <motion.div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ y: section2ImageY }}
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
            {/* Boosted Pools Section */}
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
                  BOOSTED POOLS
                </motion.h2>
                <p className="font-manrope font-light text-neutral-950 text-xl sm:text-2xl">
                  High-performance liquidity designed to increase yield while softening impermanent loss.
                </p>
                <motion.button 
                  className="bg-black/25 rounded px-8 py-5 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)]"
                  whileHover={{ 
                    scale: 1.05, 
                    backgroundColor: "rgba(0,0,0,0.35)",
                    boxShadow: "16px 16px 20px 0px rgba(0,0,0,0.40)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-syne font-semibold text-neutral-950 text-xl sm:text-2xl">
                    Join a Pool
                  </span>
                </motion.button>
              </motion.div>
            </AnimatedSection>

            {/* Oracle Pricing Section */}
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
                  ORACLE PRICING
                </motion.h2>
                <p className="font-manrope font-light text-neutral-950 text-xl sm:text-2xl">
                  Pricing follows trusted oracles to reduce toxic arbitrage and keep pools aligned.
                </p>
                <motion.button 
                  className="bg-black/25 rounded px-8 py-5 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)]"
                  whileHover={{ 
                    scale: 1.05, 
                    backgroundColor: "rgba(0,0,0,0.35)",
                    boxShadow: "16px 16px 20px 0px rgba(0,0,0,0.40)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-syne font-semibold text-neutral-950 text-xl sm:text-2xl">
                    See Oracles
                  </span>
                </motion.button>
              </motion.div>
            </AnimatedSection>

            {/* LVR Shield Section */}
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
                  LVR SHIELD
                </motion.h2>
                <p className="font-manrope font-light text-neutral-950 text-xl sm:text-2xl">
                  Prevent loss versus rebalancing with oracle-aligned pricing.
                </p>
                <motion.button 
                  className="bg-black/25 rounded px-8 py-5 shadow-[12px_12px_12px_0px_rgba(0,0,0,0.50)]"
                  whileHover={{ 
                    scale: 1.05, 
                    backgroundColor: "rgba(0,0,0,0.35)",
                    boxShadow: "16px 16px 20px 0px rgba(0,0,0,0.40)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-syne font-semibold text-neutral-950 text-xl sm:text-2xl">
                    Learn LVR
                  </span>
                </motion.button>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Section 3 - FAQ */}
      <section className="relative bg-[#e0e0e0]">
        {/* FAQ Content */}
        <div className="px-6 sm:px-8 lg:px-11 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-7xl mx-auto">
            {/* FAQ Title */}
            <motion.div 
              className="lg:w-1/3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInLeft}
            >
              <h2 className="font-playfair font-bold italic text-neutral-950 text-4xl sm:text-5xl lg:text-6xl leading-[1.1]">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0 }}
                  className="block"
                >
                  Frequently
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="block"
                >
                  Asked
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="block"
                >
                  Questions
                </motion.span>
              </h2>
            </motion.div>

            {/* FAQ Items */}
            <div className="lg:w-2/3">
              {faqData.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Section 4 - Visual */}
      <section className="relative bg-[#e0e0e0]">
        <div className="flex flex-col items-center text-center px-6 sm:px-8 lg:px-11 pt-6 sm:pt-8 lg:pt-10 translate-y-[-24px]">
          <h2 className="font-syne font-bold text-neutral-950 text-[32px] leading-tight">
            Be smart, use Apollos Finance
          </h2>
          <button className="mt-4 flex items-center rounded-[60px] px-8 py-3 bg-white text-neutral-950 border border-neutral-950 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.35)] transition-colors duration-300 hover:bg-neutral-950 hover:text-white hover:border-white">
            <span className="font-syne font-bold text-lg">
              Enter Apollos
            </span>
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

      {/* Section 5 - Footer */}
      <motion.footer 
        className="bg-[#d4d4d4] px-6 sm:px-8 lg:px-11 py-8 lg:py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/images/Logo-figma.webp"
                alt="Apollos Finance Logo"
                className="w-[50px] h-[62px] sm:w-[60px] sm:h-[75px] object-contain"
              />
              <div className="flex flex-col -space-y-2">
                <span className="font-playfair font-bold text-neutral-950 text-2xl sm:text-3xl lg:text-4xl leading-none tracking-tight">
                  APOLLOS
                </span>
                <span className="font-playfair font-bold text-neutral-950 text-base sm:text-lg lg:text-xl italic leading-tight pl-0.5">
                  Finance
                </span>
              </div>
            </motion.div>

            {/* Footer Links */}
            <motion.div 
              className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                ["Security", "Documentation", "Transparency", "Governance"],
                ["GitHub", "X (Twitter)", "Discord", "Telegram"]
              ].flat().map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(/[^a-z]/g, '')}`}
                  className="font-syne font-semibold text-neutral-950 text-base sm:text-lg relative overflow-hidden"
                  variants={staggerItem}
                  whileHover={{ x: 5, color: "#444" }}
                  transition={{ duration: 0.3 }}
                >
                  {item}
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Contact Info */}
          <motion.div 
            className="mt-8 pt-6 border-t border-neutral-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="font-syne font-bold text-neutral-950 text-base sm:text-lg">
              Contact Us :
            </p>
            <motion.a
              href="mailto:help@apollos.finance"
              className="font-manrope font-light text-neutral-950 text-base sm:text-lg"
              whileHover={{ color: "#666", x: 5 }}
              transition={{ duration: 0.3 }}
            >
              help@apollos.finance
            </motion.a>
          </motion.div>
        </div>
      </motion.footer>


      {/* Marquee Footer - Fixed at bottom */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 h-9 overflow-hidden"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div
          ref={marqueeRef}
          className="flex items-center h-full animate-marquee whitespace-nowrap"
        >
          <span className="font-syne font-medium text-white text-xl px-2">
            APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢
            BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS
            FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢
          </span>
          <span className="font-syne font-medium text-white text-xl px-2">
            APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢
            BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS
            FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢ APOLLOS FINANCE â€¢ BOOSTED POOLS â€¢ ORACLE PRICING â€¢ LVR SHIELD â€¢
          </span>
        </div>
      </motion.div>

      {/* Bottom padding to account for fixed marquee */}
      <div className="h-9"></div>
    </div>
  );
}









