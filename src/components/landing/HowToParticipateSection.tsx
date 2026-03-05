"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  {
    title: "Yield Bearing Vault",
    description:
      "Earn yield by supplying assets into the protocol while maintaining exposure to curated strategies.",
    icon: "/icons/Logo-Earn.png",
    bg: "bg-white",
    text: "text-neutral-950",
    button: "Enter Vault",
    iconBg: "bg-neutral-300",
    href: "/dashboard?tab=earn",
  },
  {
    title: "Staked Vault",
    description:
      "Stake to receive protocol-backed rewards and participate in long-term alignment incentives.",
    icon: "/icons/Logo-Pools.png",
    bg: "bg-[#d6d6d6]",
    text: "text-neutral-950",
    button: "Stake Now",
    iconBg: "bg-white",
    href: "/dashboard?tab=earn",
  },
] as const;

export function HowToParticipateSection() {
  return (
    <section className="px-6 sm:px-8 lg:px-11 py-10">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="text-center font-syne font-bold text-neutral-950 text-3xl sm:text-4xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          How to Participate
        </motion.h2>

        <motion.div
          className="relative rounded-[28px] border border-black/15 shadow-[0px_20px_30px_0px_rgba(0,0,0,0.15)]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <img
            src="/icons/Circle_1.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute z-10 left-8 top-4 w-24 sm:w-28 -translate-x-[70%] -translate-y-1/2"
          />
          <img
            src="/icons/Circle_2.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute z-10 right-8 top-80 w-24 sm:w-28 translate-x-[70%] -translate-y-1/2"
          />

          <div className="relative z-0 flex flex-col md:flex-row overflow-hidden rounded-[28px]">
            {cards.map((card) => (
              <div
                key={card.title}
                className={`relative flex-1 ${card.bg} ${card.text} px-8 py-10 md:px-10 md:py-12`}
              >
                <div className="flex items-center justify-end">
                  <div
                    className={`h-12 w-12 rounded-full ${card.iconBg} flex items-center justify-center border border-black/10`}
                  >
                    <img src={card.icon} alt="" className="h-6 w-6 object-contain" />
                  </div>
                </div>

                <h3 className="mt-6 font-syne font-bold text-2xl sm:text-3xl">
                  {card.title}
                </h3>
                <p className="mt-4 font-manrope text-sm sm:text-base text-neutral-700">
                  {card.description}
                </p>

                <Link
                  href={card.href}
                  className="mt-8 inline-flex items-center rounded-full border border-neutral-950 px-6 py-2 font-syne font-bold text-sm transition-colors duration-300 hover:bg-neutral-950 hover:text-white"
                >
                  {card.button}
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
