import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

export function StaggeredList({ children, className }: Props) {
  return <div className={className}>{children}</div>;
}

export function StaggeredItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
