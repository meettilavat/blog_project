"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** z-index layer — should be above the sticky header */
  className?: string;
};

export function ReadingProgress({ className }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    /* Measure the sticky header and position the bar at its bottom edge */
    const positionBar = () => {
      const header = document.querySelector("header");
      if (header && containerRef.current) {
        containerRef.current.style.top = `${header.offsetHeight}px`;
      }
    };

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
      positionBar();
      onScroll();
    };

    positionBar();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 z-50 h-[3px]"
      aria-hidden
      data-reading-progress
    >
      <div
        ref={barRef}
        className="h-full origin-left rounded-r-full bg-accent will-change-transform"
        style={{ transform: "scaleX(0)" }}
        data-reading-progress-bar
      />
    </div>
  );
}

export default ReadingProgress;
