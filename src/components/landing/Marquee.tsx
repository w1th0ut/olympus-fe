"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const marqueeItems = ["APOLLOS FINANCE", "LINEARIZED", "NO LVR", "ANTI-MEV"];
const repeatedItems = Array.from({ length: 6 }, () => marqueeItems).flat();

function MarqueeRow() {
  return (
    <div className="flex items-center shrink-0 min-w-full font-syne font-medium text-white text-xl">
      {repeatedItems.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center">
          <span className="px-2">{item}</span>
          <span className="px-2">&bull;</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (marqueeRef.current) {
      marqueeRef.current.style.willChange = "transform";
    }
  }, []);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 h-9 overflow-hidden"
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div ref={marqueeRef} className="flex items-center h-full animate-marquee whitespace-nowrap">
        <MarqueeRow />
        <MarqueeRow />
      </div>
    </motion.div>
  );
}
