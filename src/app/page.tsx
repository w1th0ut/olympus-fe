"use client";

import { useScroll, useTransform } from "framer-motion";
import {
  HeroSection,
  ProtocolStatsSection,
  FeaturesSection,
  FAQSection,
  VisualSection,
  FooterSection,
  Marquee,
} from "@/components/landing";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, 150]);
  const section2ImageY = useTransform(scrollYProgress, [0.2, 0.6], [0, 100]);

  return (
    <div className="bg-[#e0e0e0] overflow-x-hidden">
      <HeroSection heroImageY={heroImageY} />
      <ProtocolStatsSection />
      <FeaturesSection sectionImageY={section2ImageY} />
      <FAQSection />
      <VisualSection />
      <FooterSection />
      <Marquee />
      <div className="h-9" />
    </div>
  );
}
