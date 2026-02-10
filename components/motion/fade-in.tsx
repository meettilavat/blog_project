"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Vertical offset in px */
  y?: number;
  /** Duration in seconds */
  duration?: number;
  /** Delay in seconds */
  delay?: number;
  /** Trigger when element enters viewport */
  whileInView?: boolean;
};

const EASE = [0.25, 0.4, 0.25, 1] as const;

export function FadeIn({
  children,
  className,
  y = 24,
  duration = 0.55,
  delay = 0,
  whileInView = false
}: Props) {
  const animateProps = whileInView
    ? {
        initial: { opacity: 0, y, filter: "blur(4px)" },
        whileInView: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration, delay, ease: EASE }
        },
        viewport: { once: true, margin: "-60px" as const }
      }
    : {
        initial: { opacity: 0, y, filter: "blur(4px)" },
        animate: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration, delay, ease: EASE }
        }
      };

  return (
    <motion.div className={className} {...animateProps}>
      {children}
    </motion.div>
  );
}
