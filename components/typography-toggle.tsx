"use client";

import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { useEffect, useState } from "react";

type BodyStyle = "sans" | "serif";

export function TypographyToggle() {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<BodyStyle>("sans");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bodyStyle") as BodyStyle | null;
    const initial = stored ?? "sans";
    setStyle(initial);
    document.body.dataset.typestyle = initial;
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    document.body.dataset.typestyle = style;
    window.localStorage.setItem("bodyStyle", style);
  }, [style, mounted]);

  const toggle = () => {
    const next: BodyStyle = style === "sans" ? "serif" : "sans";
    setStyle(next);
  };

  if (!mounted) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="rounded-full border border-border/70 px-3"
      onClick={toggle}
      aria-label={style === "sans" ? "Switch to serif font" : "Switch to sans-serif font"}
    >
      <Type className="h-4 w-4" />
      <span className="ml-1 text-xs uppercase tracking-[0.2em]">{style}</span>
    </Button>
  );
}

export default TypographyToggle;
