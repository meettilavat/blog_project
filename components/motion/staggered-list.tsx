import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/ui/classnames";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

type StaggerStyle = CSSProperties & {
  "--stagger-delay": string;
  "--stagger-step": string;
};

export function StaggeredList({ children, className, delay = 0, stagger = 0.07 }: Props) {
  const style: StaggerStyle = {
    "--stagger-delay": `${delay}s`,
    "--stagger-step": `${stagger}s`
  };

  return <div className={cn("journal-stagger", className)} style={style}>{children}</div>;
}

export function StaggeredItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("journal-stagger-item", className)}>{children}</div>;
}
