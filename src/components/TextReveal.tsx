"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import React, { useRef } from "react";

interface Props {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  className?: string;
  children: React.ReactNode;
  variant?: "slide" | "blur" | "words";
}

export default function TextReveal({ 
  as: Tag = "h2", 
  delay = 0, 
  className, 
  children,
  variant = "slide"
}: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  const isWords = variant === "words";

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: delay,
      }
    }
  };

  const itemVariants = {
    hidden: { y: "110%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  const slideVariants = {
    initial: { y: "105%", opacity: 0 },
    animate: { y: "0%", opacity: 1 },
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const, delay }
  };

  const blurVariants = {
    initial: { y: "40%", opacity: 0, filter: "blur(10px)" },
    animate: { y: "0%", opacity: 1, filter: "blur(0px)" },
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay }
  };

  if (shouldReduceMotion) return <Tag className={className}>{children}</Tag>;

  if (isWords) {
    // Procesar hijos para separar palabras
    const words: React.ReactNode[] = [];
    React.Children.forEach(children, (child, i) => {
      if (typeof child === "string") {
        child.split(" ").forEach((word, j) => {
          if (word.trim()) {
            words.push(
              <span key={`word-${i}-${j}`} className="inline-block overflow-hidden align-bottom">
                <motion.span variants={itemVariants} className="inline-block mr-[0.2em]">
                  {word}
                </motion.span>
              </span>
            );
          }
        });
      } else {
        words.push(
          <span key={`el-${i}`} className="inline-block overflow-hidden align-bottom">
            <motion.span variants={itemVariants} className="inline-block mr-[0.2em]">
              {child}
            </motion.span>
          </span>
        );
      }
    });

    return (
      <Tag ref={ref} className={className}>
        <motion.span
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="inline"
        >
          {words}
        </motion.span>
      </Tag>
    );
  }

  const selected = variant === "blur" ? blurVariants : slideVariants;

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        initial={selected.initial}
        animate={isInView ? selected.animate : {}}
        transition={selected.transition}
      >
        <Tag className={className}>{children}</Tag>
      </motion.div>
    </div>
  );
}
