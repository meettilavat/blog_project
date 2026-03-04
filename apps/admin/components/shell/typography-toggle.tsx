"use client";

import { Button } from "@/components/ui/button";
import { useTypography } from "@/components/ui/ui-environment";
import { Type } from "lucide-react";

function TypographyToggle() {
  const { typographyStyle, toggleTypographyStyle } = useTypography();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="rounded-full border border-border/70 px-3"
      onClick={toggleTypographyStyle}
      aria-label={typographyStyle === "sans" ? "Switch to serif font" : "Switch to sans-serif font"}
    >
      <Type className="h-4 w-4" />
      <span className="ml-1 text-xs uppercase tracking-[0.2em]">{typographyStyle}</span>
    </Button>
  );
}

export default TypographyToggle;
