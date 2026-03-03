"use client";

import { motion } from "framer-motion";

const stats = [
  {
    label: "Treasury Value",
    value: "$186,959,109",
  },
  {
    label: "Highest APY",
    value: "12.5%",
  },
  {
    label: "Operating Since",
    value: "February 2026",
  },
];

export function ProtocolStatsSection() {
  return (
    <section className="relative -mt-12 sm:-mt-16 lg:-mt-20 px-6 sm:px-8 lg:px-11">
      <motion.div
        className="mx-auto max-w-6xl rounded-[28px] border border-black/15 bg-white px-6 py-6 sm:px-8 sm:py-8 shadow-[0px_20px_30px_0px_rgba(0,0,0,0.15)]"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2
          className="font-syne font-bold text-neutral-950 text-2xl sm:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Protocol Stats
        </motion.h2>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <p className="font-manrope text-sm text-neutral-700">{stat.label}</p>
              <p className="mt-2 font-syne font-bold text-2xl sm:text-3xl text-neutral-950">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
