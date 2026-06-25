"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function FooterCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.85], ["2.5rem", "0rem"]);

  return (
    <motion.footer
      ref={ref}
      style={{ scale, y, borderRadius }}
      className="bg-slate-900 text-slate-400 relative overflow-hidden shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.5)]"
    >
      {children}
    </motion.footer>
  );
}
