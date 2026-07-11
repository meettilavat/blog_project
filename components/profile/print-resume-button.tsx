"use client";

import { Printer } from "lucide-react";

export function printResume() {
  window.print();
}

export function PrintResumeButton() {
  return (
    <button
      type="button"
      onClick={printResume}
      className="print:hidden inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 transition-[transform,border-color,color] duration-200 hover:-translate-y-[1px] hover:border-foreground/40 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
    >
      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
      Print resume
    </button>
  );
}
