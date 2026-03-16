"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import {
  HeroSection,
  ProtocolStatsSection,
  FeaturesSection,
  HowToParticipateSection,
  FAQSection,
  IntegratedWithSection,
  VisualSection,
  FooterSection,
  Marquee,
} from "@/components/landing";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.3], [0, 150]);
  const section2ImageY = useTransform(scrollYProgress, [0.2, 0.6], [0, 100]);
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="bg-[#e0e0e0] overflow-x-hidden">
      {/* Scroll Progress Indicator */}
      <motion.div
        className="scroll-progress-bar"
        style={{ scaleX: progressScaleX }}
      />

      <HeroSection heroImageY={heroImageY} />
      <ProtocolStatsSection />
      <FeaturesSection sectionImageY={section2ImageY} />
      <HowToParticipateSection />
      <FAQSection />
      <IntegratedWithSection />
      <VisualSection />
      <FooterSection />
      <Marquee />
      <div className="h-9" />
    </div>
  );
}
