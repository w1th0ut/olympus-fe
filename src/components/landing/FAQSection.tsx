"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInLeft } from "@/components/landing/animations";
import { FAQItem } from "@/components/landing/FAQItem";
import { faqData } from "@/components/landing/faq-data";

export function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
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
                key={faq.question}
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
  );
}
