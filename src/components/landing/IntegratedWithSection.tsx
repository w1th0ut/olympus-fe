"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/landing/animations";

const partners = [
  { name: "Polkadot Hub TestNet", logo: "/icons/Logo-Polkadot Hub TestNet.png" },
  { name: "Pyth Network", logo: "/icons/Logo-Pyth.png" },
  { name: "Polkadot Agent Kit", logo: "/icons/Logo-Polkadot Big.png" },
  { name: "Hydration (DEX & Lend)", logo: "/icons/Logo-Hydration.png" },
  { name: "Hyperbridge (XCM)", logo: "/icons/Logo-Hyperbridge-Big.png" },
  { name: "Gemini API", logo: "/icons/Logo-Gemini.png" },
];

function TiltLogo({ partner }: { partner: typeof partners[0] }) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [25, -25]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-25, 25]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    
    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      variants={staggerItem}
      className="partner-logo-wrap text-center cursor-default group"
      style={{
        perspective: "1000px",
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={partner.logo}
          alt={partner.name}
          className="mx-auto h-32 sm:h-36 w-auto max-w-[120px] sm:max-w-[160px] object-contain select-none drop-shadow-md"
          style={{ transform: "translateZ(30px)" }}
        />
        <p className="mt-4 font-manrope text-base sm:text-xl text-neutral-500 group-hover:text-neutral-950 transition-colors"
           style={{ transform: "translateZ(10px)" }}>
          {partner.name}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function IntegratedWithSection() {
  return (
    <section className="px-6 sm:px-8 lg:px-11 py-20 bg-[#e0e0e0]/30">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="text-center font-playfair font-bold italic text-neutral-950 text-4xl sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          Integrated With
        </motion.h2>

        <motion.div
          className="mt-16 grid grid-cols-2 gap-y-16 gap-x-10 sm:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {partners.map((partner) => (
            <TiltLogo key={partner.name} partner={partner} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
