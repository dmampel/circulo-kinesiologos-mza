"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HeroCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, y }}
      className="bg-slate-900 pt-40 pb-32 relative overflow-hidden rounded-b-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]"
    >
      {children}
    </motion.div>
  );
}
