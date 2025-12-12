"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeadingItem } from "@/lib/utils";

type Props = {
  headings: HeadingItem[];
};

export function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!headings.length) return;
    const onScroll = () => {
      const offsets = headings.map((h) => {
        const el = document.getElementById(h.id);
        if (!el) return { id: h.id, top: Number.POSITIVE_INFINITY };
        const rect = el.getBoundingClientRect();
        return { id: h.id, top: rect.top };
      });
      const visible = offsets
        .filter((o) => o.top >= 0 && o.top < window.innerHeight * 0.6)
        .sort((a, b) => a.top - b.top);
      if (visible[0]) setActiveId(visible[0].id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  if (!headings.length) return null;

  const list = (
    <ul className="space-y-2 text-sm leading-snug text-foreground/70">
      {headings.map((heading) => (
        <li key={heading.id} className="pl-2" style={{ marginLeft: (heading.level - 1) * 10 }}>
          <Link
            href={`#${heading.id}`}
            className={`transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
              activeId === heading.id ? "text-foreground font-semibold" : ""
            }`}
          >
            {heading.text}
          </Link>
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
      <aside className="sticky top-24 hidden w-60 flex-shrink-0 md:block">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
          On this page
        </p>
        {list}
      </aside>
    </>
  );
}

export default TableOfContents;
