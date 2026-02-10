"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Github, Linkedin, Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

export default function PublicHeader() {
  const pathname = usePathname();
  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isReadActive = pathname === "/" || pathname.startsWith("/posts");
  const isResumeActive = pathname === "/resume";

  const navLinks = [
    {
      href: "/",
      label: "Read",
      isActive: isReadActive
    },
    {
      href: "/resume",
      label: "Resume",
      isActive: isResumeActive
    }
  ];

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isMenuOpen]);

  const navLinkClass = (isActive: boolean, isMobile = false) =>
    cn(
      "group relative overflow-hidden rounded-full px-3 py-1 transition-[transform,color,background-color] duration-200 hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none",
      isMobile && "block rounded-xl px-3 py-2 text-[11px]",
      isActive && "text-foreground font-semibold"
    );
  const navHighlightClass = (isActive: boolean) =>
    cn(
      "absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:scale-100 motion-reduce:transition-none",
      isActive && "scale-100 opacity-100"
    );

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl dark:bg-card/70">
      <div className="container py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="text-base font-semibold tracking-tight sm:text-lg">
            meettilavat.com
          </Link>
          <div className="hidden h-[18px] w-px bg-border sm:block" aria-hidden="true" />
          <nav className="ml-1 hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground/80 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.isActive)}
                aria-current={item.isActive ? "page" : undefined}
              >
                <span className={navHighlightClass(item.isActive)} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-9 items-center overflow-hidden rounded-full border border-border/70 bg-foreground/10 shadow-soft">
              <a
                href="https://github.com/meettilavat"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="inline-flex h-full w-10 items-center justify-center rounded-l-full text-foreground/70 transition-[transform,background-color,color] duration-200 hover:translate-y-[-1px] hover:bg-foreground/10 hover:text-foreground active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:hover:bg-white/10 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <span className="h-5 w-px bg-border/70" aria-hidden="true" />
              <a
                href="https://www.linkedin.com/in/meettilavat/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-full w-10 items-center justify-center text-foreground/70 transition-[transform,background-color,color] duration-200 hover:translate-y-[-1px] hover:bg-foreground/10 hover:text-foreground active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:hover:bg-white/10 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <Linkedin className="h-5 w-5" aria-hidden="true" />
              </a>
              <span className="h-5 w-px bg-border/70" aria-hidden="true" />
              <ThemeToggle className="h-full rounded-none border-0 bg-transparent px-3 hover:bg-foreground/10 dark:hover:bg-white/10" />
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-[background-color,color,border-color] duration-200 hover:border-foreground/40 hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:hidden motion-reduce:transition-none"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls={menuId}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={cn(
            "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out md:hidden motion-reduce:transition-none",
            isMenuOpen
              ? "max-h-64 opacity-100 pt-3"
              : "pointer-events-none max-h-0 -translate-y-1 opacity-0 motion-reduce:translate-y-0"
          )}
        >
          <nav aria-label="Primary" className="grid gap-2 rounded-2xl border border-border/70 bg-card/90 p-2 shadow-soft">
            {navLinks.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={navLinkClass(item.isActive, true)}
                aria-current={item.isActive ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className={navHighlightClass(item.isActive)} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
