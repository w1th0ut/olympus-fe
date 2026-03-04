"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Arbitrum", logo: "/icons/Logo-Arbitrum.png" },
  { name: "Chainlink", logo: "/icons/Logo-Chainlink.png" },
  { name: "Base", logo: "/icons/Logo-Base.png" },
  { name: "Uniswap", logo: "/icons/Logo-Uniswap.png" },
  { name: "Aave", logo: "/icons/Logo-Aave.png" },
  { name: "Gemini API", logo: "/icons/Logo-Gemini.png" },
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
                className="mx-auto h-32 sm:h-36 w-auto max-w-[120px] sm:max-w-[160px] object-contain"
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

