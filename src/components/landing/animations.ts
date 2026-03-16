import type { Variants } from "framer-motion";

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8 },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8 },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// ─── New: word-by-word reveal ────────────────────────────────────────────────

export const wordContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.5 },
  },
};

export const wordItem: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

// ─── New: clip-path reveal (wipe-up) ────────────────────────────────────────

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(100% 0% 0% 0%)", opacity: 0 },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    opacity: 1,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── New: scroll progress + orb float ───────────────────────────────────────

export const floatOrb: Variants = {
  animate: {
    y: [0, -18, 0, 12, 0],
    x: [0, 10, -8, 4, 0],
    scale: [1, 1.05, 0.97, 1.03, 1],
    transition: {
      duration: 9,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const floatOrbSlow: Variants = {
  animate: {
    y: [0, 14, -10, 8, 0],
    x: [0, -12, 6, -4, 0],
    scale: [1, 0.95, 1.06, 0.98, 1],
    transition: {
      duration: 13,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
