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
  const [isScrolled, setIsScrolled] = useState(false);
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

  // Scroll-driven header shadow
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass = (isActive: boolean, isMobile = false) =>
    cn(
      "relative px-3 py-1.5 text-foreground/70 transition-[color] duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
      isMobile && "block rounded-xl px-3 py-2.5 text-[11px]",
      isActive && "text-foreground font-semibold"
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 dark:bg-card/70",
        isScrolled
          ? "border-border/70 shadow-[0_1px_12px_rgba(36,30,24,0.06)] dark:shadow-[0_1px_12px_rgba(0,0,0,0.2)]"
          : "border-transparent"
      )}
    >
      <div className="container py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="text-base font-semibold tracking-tight sm:text-lg">
            meettilavat.com
          </Link>
          <div className="hidden h-[18px] w-px bg-border sm:block" aria-hidden="true" />
          <nav className="ml-1 hidden items-center gap-1 text-xs uppercase tracking-[0.18em] md:flex" aria-label="Main">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.isActive)}
                aria-current={item.isActive ? "page" : undefined}
              >
                {item.label}
                {/* Active underline indicator */}
                <span
                  className={cn(
                    "absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-accent transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
                    item.isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0"
                  )}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {/* Social links — ghost style, no pill wrapper */}
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/meettilavat"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 transition-[color,background-color] duration-200 hover:bg-foreground/8 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
              >
                <Github className="h-[18px] w-[18px]" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/meettilavat/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 transition-[color,background-color] duration-200 hover:bg-foreground/8 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
              >
                <Linkedin className="h-[18px] w-[18px]" aria-hidden="true" />
              </a>
              <ThemeToggle className="h-8 w-8 border-0 bg-transparent text-foreground/50 hover:bg-foreground/8 hover:text-foreground" />
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
          role="navigation"
          aria-label="Mobile navigation"
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
                className={cn(
                  navLinkClass(item.isActive, true),
                  item.isActive && "bg-muted rounded-xl"
                )}
                aria-current={item.isActive ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
