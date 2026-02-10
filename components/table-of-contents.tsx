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
    <ul className="space-y-2 text-sm leading-snug text-foreground/70">
      {headings.map((heading) => (
        <li key={heading.id} className="pl-2" style={{ marginLeft: (heading.level - 1) * 10 }}>
          <a
            href={`#${heading.id}`}
            aria-current={trackActive && heading.id === activeId ? "location" : undefined}
            className={cn(
              "block rounded-lg px-2 py-1 transition-[color,background-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
              trackActive && heading.id === activeId
                ? "bg-muted text-foreground"
                : "hover:text-foreground"
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <details className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 md:hidden">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          On this page
        </summary>
        <div className="mt-3">{list}</div>
      </details>
      <aside className="hidden w-60 flex-shrink-0 md:sticky md:block" style={{ top: offsetTop }}>
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
          On this page
        </p>
        {list}
      </aside>
    </>
  );
}

export default TableOfContents;
