import Link from "next/link";
import { formatDate } from "@/lib/typography/date";
import type { FeaturedPost } from "@/lib/posts/featured";
// HeroFieldLoader is a client component ("use client"); it owns the gated,
// ssr:false dynamic import of the field chunk (returning null for
// prefers-reduced-motion / Save-Data before the chunk is ever requested,
// spec §5.1). A Server Component cannot pass ssr:false to next/dynamic, so the
// loader is imported directly here rather than via dynamic().
import HeroFieldLoader from "@/components/home/hero-field-loader";

type HeroProps = {
  featured: FeaturedPost;
  isLatest: boolean;
};

export default async function Hero({ featured, isLatest }: HeroProps) {
  return (
    /* `hero-bleed` widens the section to the viewport so the field is not confined
       to the text column; `site-canvas` on the inner block re-applies the exact
       container the section just escaped, so the copy stays aligned with every
       other section on the page. Reusing the class rather than restating its width
       and padding is what keeps the two from drifting apart. */
    <section
      aria-labelledby="hero-title"
      className="hero-bleed relative min-h-[70svh] overflow-hidden"
    >
      <div className="site-canvas relative z-10 flex min-h-[70svh] flex-col justify-center">
        <p className="kicker">Meet Tilavat</p>
        <p className="kicker mt-2 text-accent">{isLatest ? "Latest" : "Featured"}</p>
        <p className="mt-4 max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed text-foreground/75">
          Production lessons from running my own stack — the failures included.
        </p>
        <h1
          id="hero-title"
          className="mt-6 max-w-[16ch] text-balance font-display text-[clamp(2.75rem,6vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground"
        >
          <Link
            href={`/posts/${featured.slug}`}
            className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {featured.title}
          </Link>
        </h1>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 [font-variant-numeric:tabular-nums]">
          {formatDate(featured.createdAt)} · {featured.minutes} min read
        </p>
      </div>
      <HeroFieldLoader title={featured.title} />
    </section>
  );
}
