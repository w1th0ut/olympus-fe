"use client";

import { useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

export function FAQItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
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
