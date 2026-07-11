import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/ui/classnames";

type Props = {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  delay?: number;
  whileInView?: boolean;
};

type RevealStyle = CSSProperties & {
  "--reveal-delay": string;
  "--reveal-duration": string;
  "--reveal-y": string;
};

export function FadeIn({
  children,
  className,
  y = 16,
  duration = 0.42,
  delay = 0,
  whileInView = false
}: Props) {
  const style: RevealStyle = {
    "--reveal-delay": `${delay}s`,
    "--reveal-duration": `${duration}s`,
    "--reveal-y": `${y}px`
  };

  return (
    <div
      className={cn("journal-reveal", className)}
      data-reveal-on-scroll={whileInView ? "true" : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
