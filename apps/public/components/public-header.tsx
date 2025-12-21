"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Github, Linkedin } from "lucide-react";

export default function PublicHeader() {
  const pathname = usePathname();
  const isReadActive = pathname === "/" || pathname.startsWith("/posts");
  const isResumeActive = pathname === "/resume";

  const navLinkClass = (isActive: boolean) =>
    cn(
      "group relative overflow-hidden rounded-full px-3 py-1 transition-transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
      isActive && "text-foreground font-semibold"
    );
  const navHighlightClass = (isActive: boolean) =>
    cn(
      "absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100",
      isActive && "scale-100 opacity-100"
    );

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl dark:bg-card/70">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            meettilavat.com
          </Link>
          <div className="h-[18px] w-[1px] bg-border" />
          <nav className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-foreground/80">
            <Link href="/" className={navLinkClass(isReadActive)} aria-current={isReadActive ? "page" : undefined}>
              <span className={navHighlightClass(isReadActive)} />
              <span className="relative z-10">Read</span>
            </Link>
            <Link
              href="/resume"
              className={navLinkClass(isResumeActive)}
              aria-current={isResumeActive ? "page" : undefined}
            >
              <span className={navHighlightClass(isResumeActive)} />
              <span className="relative z-10">Resume</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center">
          <div className="flex h-9 items-center overflow-hidden rounded-full border border-border/70 bg-foreground/10 shadow-soft">
            <a
              href="https://github.com/meettilavat"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex h-full w-10 items-center justify-center rounded-l-full text-foreground/70 transition-[transform,background-color,color] duration-200 hover:translate-y-[-1px] hover:bg-foreground/10 hover:text-foreground active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:hover:bg-white/10"
            >
              <Github className="h-5 w-5" aria-hidden="true" />
            </a>
            <span className="h-5 w-px bg-border/70" aria-hidden="true" />
            <a
              href="https://www.linkedin.com/in/meettilavat/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-full w-10 items-center justify-center rounded-r-full text-foreground/70 transition-[transform,background-color,color] duration-200 hover:translate-y-[-1px] hover:bg-foreground/10 hover:text-foreground active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:hover:bg-white/10"
            >
              <Linkedin className="h-5 w-5" aria-hidden="true" />
            </a>
            <span className="h-5 w-px bg-border/70" aria-hidden="true" />
            <ThemeToggle className="h-full rounded-none border-0 bg-transparent px-3 hover:bg-foreground/10 dark:hover:bg-white/10" />
          </div>
        </div>
      </div>
    </header>
  );
}
