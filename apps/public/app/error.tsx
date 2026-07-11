"use client";

import Link from "next/link";

type PublicErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function retryPublicRoute(reset: () => void) {
  reset();
}

export default function PublicError({ reset }: PublicErrorProps) {
  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-border/70 bg-card/85 p-8 text-center shadow-soft sm:p-12">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
        Temporary interruption
      </p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight text-foreground">
        Something interrupted this page.
      </h1>
      <p className="mx-auto mt-4 max-w-[52ch] text-base leading-relaxed text-foreground/72">
        The content is still here. Retry the request, or return to the latest writing.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retryPublicRoute(reset)}
          className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full border border-border/80 bg-card px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Latest writing
        </Link>
      </div>
    </section>
  );
}
