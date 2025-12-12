import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-tight transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "relative overflow-hidden bg-foreground text-background hover:bg-foreground/80 active:bg-foreground/70 focus-visible:outline-foreground shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]",
        outline:
          "border border-foreground/50 bg-transparent text-foreground hover:bg-foreground hover:text-background active:bg-foreground/80 focus-visible:outline-foreground shadow-[0_10px_30px_-14px_rgba(0,0,0,0.35)]",
        ghost:
          "hover:bg-foreground/10 active:bg-foreground/15 text-foreground focus-visible:outline-foreground",
        subtle:
          "bg-muted text-foreground hover:shadow-soft active:shadow-none focus-visible:outline-foreground"
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn("group relative overflow-hidden", buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        <span className="pointer-events-none absolute inset-0 scale-95 rounded-full bg-white/10 opacity-0 blur transition duration-300 group-hover:opacity-100 group-active:opacity-70" />
        {isLoading ? <span className="animate-pulse">···</span> : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
