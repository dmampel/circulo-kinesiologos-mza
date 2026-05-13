"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { fadeUp, fadeIn, staggerContainer, staggerItem } from "@/lib/animations";

const variantMap = { fadeUp, fadeIn, staggerContainer, staggerItem };
type VariantKey = keyof typeof variantMap;

interface ScrollRevealProps {
  variant?: VariantKey;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export default function ScrollReveal({
  variant = "fadeUp",
  delay = 0,
  className,
  children,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  const resolved = shouldReduceMotion ? { hidden: {}, visible: {} } : variantMap[variant];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={resolved}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  className?: string;
  children: React.ReactNode;
}

export function StaggerItem({ className, children }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const resolved = shouldReduceMotion ? { hidden: {}, visible: {} } : staggerItem;

  return (
    <motion.div variants={resolved} className={className}>
      {children}
    </motion.div>
  );
}
