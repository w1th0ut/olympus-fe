"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Arbitrum", logo: "/images/Logo-figma.webp" },
  { name: "Chainlink", logo: "/images/Logo-figma.webp" },
  { name: "Base", logo: "/images/Logo-figma.webp" },
  { name: "Uniswap", logo: "/images/Logo-figma.webp" },
  { name: "Aave", logo: "/images/Logo-figma.webp" },
  { name: "Gemini API", logo: "/images/Logo-figma.webp" },
];

export function IntegratedWithSection() {
  return (
    <section className="px-6 sm:px-8 lg:px-11 py-20">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {partners.map((partner) => (
            <div key={partner.name} className="text-center">
              <img
                src={partner.logo}
                alt={partner.name}
                className="mx-auto h-32 sm:h-36 w-auto object-contain"
              />
              <p className="mt-4 font-manrope text-base sm:text-xl text-neutral-500">
                {partner.name}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
