"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/ui/classnames";

type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

type Props = {
  headings: HeadingItem[];
  offsetTop?: number;
  trackActive?: boolean;
  variant?: "compact" | "rail";
  className?: string;
};

export function TableOfContents({
  headings,
  offsetTop = 96,
  trackActive = true,
  variant = "compact",
  className
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);
  const headingIds = useMemo(
    () => Array.from(new Set(headings.map((heading) => heading.id).filter(Boolean))),
    [headings]
  );

  useEffect(() => {
    if (!trackActive || headingIds.length === 0) return undefined;

    const targets = headingIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!targets.length) return undefined;

    const inView = new Map<string, number>();
    const setFallbackId = () => {
      let fallback = headingIds[0];
      for (const id of headingIds) {
        const node = document.getElementById(id);
        if (!node) continue;
        if (node.getBoundingClientRect().top - offsetTop <= 10) {
          fallback = id;
        } else {
          break;
        }
      }
      setActiveId(fallback);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (!id) continue;
          if (entry.isIntersecting) {
            inView.set(id, entry.boundingClientRect.top);
          } else {
            inView.delete(id);
          }
        }

        if (inView.size > 0) {
          const closest = Array.from(inView.entries()).sort(
            (a, b) => Math.abs(a[1] - offsetTop) - Math.abs(b[1] - offsetTop)
          )[0];
          if (closest?.[0]) {
            setActiveId(closest[0]);
          }
          return;
        }

        setFallbackId();
      },
      {
        rootMargin: `-${offsetTop + 10}px 0px -55% 0px`,
        threshold: [0, 1]
      }
    );

    targets.forEach((target) => observer.observe(target));
    setFallbackId();

    return () => observer.disconnect();
  }, [headingIds, offsetTop, trackActive]);

  if (!headings.length) return null;

  const list = (
    <ol
      className={cn(
        "m-0 list-none p-0 text-[13px] leading-snug text-foreground/68",
        variant === "rail"
          ? "space-y-1 border-l border-border/50 pl-3"
          : "space-y-1.5 pt-3"
      )}
    >
      {headings.map((heading, index) => {
        const isActive = trackActive && heading.id === activeId;
        return (
          <li
            key={heading.id}
            className="relative"
          >
            {variant === "rail" && isActive ? (
              <span
                className="absolute -left-[17px] top-0 h-full w-[2px] bg-accent"
                aria-hidden="true"
              />
            ) : null}
            <a
              href={`#${heading.id}`}
              aria-current={isActive ? "location" : undefined}
              style={
                variant === "compact"
                  ? { paddingLeft: `${(heading.level - 1) * 12}px` }
                  : undefined
              }
              className={cn(
                "rounded-r-sm py-1.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none",
                variant === "rail"
                  ? "grid grid-cols-[1.65rem_minmax(0,1fr)] gap-2"
                  : "block",
                isActive ? "font-semibold text-foreground" : "hover:text-foreground",
                variant === "rail" && isActive ? "text-accent" : null
              )}
            >
              {variant === "rail" ? (
                <>
                  <span className="font-mono text-[10px] leading-5 text-foreground/38 [font-variant-numeric:tabular-nums]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span style={{ paddingLeft: `${Math.max(heading.level - 1, 0) * 8}px` }}>
                    {heading.text}
                  </span>
                </>
              ) : (
                heading.text
              )}
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "rail") {
    return (
      <aside
        className={cn("self-start overflow-y-auto pr-1 pt-1", className)}
        aria-label="On this page"
        style={{
          top: offsetTop,
          maxHeight:
            typeof offsetTop === "number"
              ? `calc(100vh - ${offsetTop + 24}px)`
              : undefined
        }}
      >
        <div className="mb-3 border-b border-border/35 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/48">
            On this page
          </p>
          <p className="mt-1 text-[12px] leading-snug text-foreground/42">
            Sticky chapter map
          </p>
        </div>
        {list}
      </aside>
    );
  }

  return (
    <details
      className={cn("mb-8 border-y border-border/45 py-3 2xl:hidden", className)}
      aria-label="On this page"
    >
      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-foreground">
        On this page
      </summary>
      {list}
    </details>
  );
}

export default TableOfContents;
