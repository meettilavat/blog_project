"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  offset?: number;
};

export function ReadingProgress({ offset = 0 }: Props) {
  const [progress, setProgress] = useState(0);
  const target = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      target.current = percent;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const animate = () => {
      setProgress((prev) => {
        const next = target.current;
        const delta = next - prev;
        const step = delta * 0.15;
        if (Math.abs(delta) < 0.2) return next;
        return prev + step;
      });
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 z-30 h-1"
      style={{ top: offset }}
      aria-hidden
    >
      <div
        className="h-full rounded-r-full bg-border/80 transition-[width] duration-300 dark:bg-border/70"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default ReadingProgress;
