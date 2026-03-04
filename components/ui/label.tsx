import * as React from "react";
import { cn } from "@/lib/ui/classnames";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium tracking-tight text-foreground/80",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
