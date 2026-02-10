"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay (seconds) before the stagger sequence starts */
  delay?: number;
  /** Stagger interval between children (seconds) */
  stagger?: number;
};

const container = {
  hidden: {},
  show: (opts: { delay: number; stagger: number }) => ({
    transition: {
      staggerChildren: opts.stagger,
      delayChildren: opts.delay
    }
  })
};

const item = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }
  }
};

export function StaggeredList({
  children,
  className,
  delay = 0.08,
  stagger = 0.08
}: Props) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      custom={{ delay, stagger }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
