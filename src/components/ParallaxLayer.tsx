"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface Props {
  speed?: number;
  className?: string;
  children: React.ReactNode;
}

export default function ParallaxLayer({ speed = 0.15, className, children }: Props) {
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const y = useTransform(scrollY, [0, 800], shouldReduceMotion ? [0, 0] : [0, -800 * speed]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
