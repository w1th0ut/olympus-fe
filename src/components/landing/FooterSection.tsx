"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/landing/animations";

const footerNavLinks = [
  { label: "Security", href: "/security" },
  { label: "Documentation", href: "/docs" },
  { label: "Transparency", href: "/transparency" },
  { label: "Governance", href: "/governance" },
];

const footerSocialLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "X (Twitter)", href: "https://x.com" },
  { label: "Discord", href: "https://discord.com" },
  { label: "Telegram", href: "https://telegram.org" },
];

export function FooterSection() {
  return (
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
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
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
            {[...footerNavLinks, ...footerSocialLinks].map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="font-syne font-semibold text-neutral-950 text-base sm:text-lg relative overflow-hidden"
                variants={staggerItem}
                whileHover={{ x: 5, color: "#444" }}
                transition={{ duration: 0.3 }}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {item.label}
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
          <p className="font-syne font-bold text-neutral-950 text-base sm:text-lg">Contact Us :</p>
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
  );
}
