"use client";

import { useEffect, useMemo, useState } from "react";
import { HeadingItem, cn } from "@/lib/utils";

type Props = {
  headings: HeadingItem[];
  offsetTop?: number;
  trackActive?: boolean;
};

export function TableOfContents({
  headings,
  offsetTop = 96,
  trackActive = true
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
    <ul className="relative space-y-1 text-sm leading-snug text-foreground/65">
      {/* Vertical track line */}
      <span
        className="absolute left-0 top-0 h-full w-px bg-border/60"
        aria-hidden="true"
      />
      {headings.map((heading) => {
        const isActive = trackActive && heading.id === activeId;
        return (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 10 + 12}px` }}
            className="relative"
          >
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute left-[-3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent transition-[opacity] duration-200"
                aria-hidden="true"
              />
            )}
            <a
              href={`#${heading.id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "block rounded-md px-2 py-1.5 transition-[color,background-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
                isActive
                  ? "bg-accent/10 font-medium text-foreground"
                  : "hover:text-foreground"
              )}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <details className="mb-6 rounded-2xl border border-border/70 bg-card/80 md:hidden">
        <summary className="cursor-pointer rounded-2xl px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-foreground/60 transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          On this page
        </summary>
        <div className="border-t border-border/50 px-4 pb-4 pt-3">{list}</div>
      </details>
      <aside className="hidden w-60 flex-shrink-0 md:sticky md:block" style={{ top: offsetTop }}>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/50">
          On this page
        </p>
        {list}
      </aside>
    </>
  );
}

export default TableOfContents;
