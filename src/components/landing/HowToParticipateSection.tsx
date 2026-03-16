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

function Card({
  card,
  index,
}: {
  card: (typeof cards)[number];
  index: number;
}) {
  return (
    <div className={`flex-1 relative ${card.bg}`}>
      <motion.div
        className={`relative h-full ${card.bg} ${card.text} px-8 py-10 md:px-10 md:py-12 flex flex-col`}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ 
          opacity: { duration: 0.6, delay: index * 0.15 },
          y: { duration: 0.6, delay: index * 0.15 },
        }}
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
      >
        <div className="flex items-center justify-end">
          <div
            className={`h-12 w-12 rounded-full ${card.iconBg} flex items-center justify-center border border-black/10`}
          >
            <img src={card.icon} alt="" className="h-6 w-6 object-contain" />
          </div>
        </div>

        <div>
          <h3 className="mt-6 font-syne font-bold text-2xl sm:text-3xl">
            {card.title}
          </h3>
          <p className="mt-4 font-manrope text-sm sm:text-base text-neutral-700">
            {card.description}
          </p>

          <Link
            href={card.href}
            className="mt-8 inline-flex items-center rounded-full border border-neutral-950 px-6 py-2 font-syne font-bold text-sm transition-all duration-300 hover:bg-neutral-950 hover:text-white hover:shadow-md"
          >
            {card.button}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function HowToParticipateSection() {
  return (
    <section className="px-6 sm:px-8 lg:px-11 py-24 relative overflow-visible">
      <div className="mx-auto max-w-6xl relative">
        <motion.h2
          className="text-center font-syne font-bold text-neutral-950 text-3xl sm:text-4xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          How to Participate
        </motion.h2>

        {/* Ring elements are placed outside the main box container to prevent clipping */}
        <div className="relative">
          {/* Floating decor circles with rotation and float loops */}
          <motion.img
            src="/icons/Circle_1.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute z-20 left-0 top-0 w-24 sm:w-32 -translate-x-1/2 -translate-y-1/2"
            animate={{ 
              rotate: 360,
              y: [0, -15, 0],
              x: [0, 5, 0]
            }}
            transition={{ 
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <motion.img
            src="/icons/Circle_2.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute z-20 right-0 bottom-0 w-24 sm:w-32 translate-x-1/3 translate-y-1/3"
            animate={{ 
              rotate: -360,
              y: [0, 15, 0],
              x: [0, -8, 0]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          <motion.div
            className="relative z-10 rounded-[28px] border border-black/15 shadow-[0px_20px_30px_0px_rgba(0,0,0,0.15)] overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative flex flex-col md:flex-row">
              {cards.map((card, index) => (
                <Card key={card.title} card={card} index={index} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
