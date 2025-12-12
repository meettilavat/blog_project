import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "muted" | "outline";
  className?: string;
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        variant === "default" && "bg-foreground text-background",
        variant === "muted" && "bg-muted text-foreground",
        variant === "outline" &&
          "border border-foreground/40 bg-card text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
