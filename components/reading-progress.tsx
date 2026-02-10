"use client";

import { useEffect, useRef } from "react";

type Props = {
  offset?: number;
};

export function ReadingProgress({ offset = 0 }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

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

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 z-30 h-1"
      style={{ top: offset }}
      aria-hidden
      data-reading-progress
    >
      <div
        ref={barRef}
        className="h-full origin-left rounded-r-full bg-border/80 will-change-transform dark:bg-border/70"
        style={{ transform: "scaleX(0)" }}
        data-reading-progress-bar
      />
    </div>
  );
}

export default ReadingProgress;
