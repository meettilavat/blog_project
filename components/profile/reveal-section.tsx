import type { ReactNode } from "react";
import { FadeIn } from "@/components/motion/fade-in";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function RevealSection({ children, className, delay = 0 }: Props) {
  return (
    <FadeIn className={className} delay={delay} duration={0.44} y={14} whileInView>
      {children}
    </FadeIn>
  );
}
