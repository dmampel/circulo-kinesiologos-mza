"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export default function HeroGlows() {
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  const blob1Y = useTransform(scrollY, [0, 600], shouldReduceMotion ? [0, 0] : [0, -80]);
  const blob1X = useTransform(scrollY, [0, 600], shouldReduceMotion ? [0, 0] : [0, 30]);
  const blob2Y = useTransform(scrollY, [0, 600], shouldReduceMotion ? [0, 0] : [0, -140]);
  const blob2X = useTransform(scrollY, [0, 600], shouldReduceMotion ? [0, 0] : [0, -40]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <motion.div
        style={{ y: blob1Y, x: blob1X }}
        className="absolute top-10 left-10 w-80 h-80 bg-blue-600 rounded-full blur-[130px] opacity-25"
      />
      <motion.div
        style={{ y: blob2Y, x: blob2X }}
        className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-[150px] opacity-15"
      />
    </div>
  );
}
