"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/ui/classnames";
import { useHeaderOffset } from "@/components/ui/ui-environment";

type Props = {
  /** z-index layer — should be above the sticky header */
  className?: string;
  /** Optional fixed top offset in pixels, used when no header measurement is needed. */
  offset?: number;
};

export function ReadingProgress({ className, offset }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerOffset = useHeaderOffset();
  const resolvedOffset = typeof offset === "number" ? offset : headerOffset;

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || 0;
      const docHeight = doc.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${ratio})`;
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      if (containerRef.current) {
        containerRef.current.style.top = `${resolvedOffset}px`;
      }
      onScroll();
    };

    if (containerRef.current) {
      containerRef.current.style.top = `${resolvedOffset}px`;
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [resolvedOffset]);

  return (
    <div
      ref={containerRef}
      className={cn("fixed left-0 right-0 z-50 h-[2px]", className)}
      aria-hidden
      data-reading-progress
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-accent will-change-transform"
        style={{ transform: "scaleX(0)" }}
        data-reading-progress-bar
      />
    </div>
  );
}
