"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Menu, type LucideIcon, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import ThemeToggle from "@/components/layout/theme-toggle";
import { getPublicLinks } from "@/lib/public-links";
import { cn } from "@/lib/ui/classnames";

type NavLink = {
  href: string;
  label: string;
  isActive: boolean;
};

const NAV_ITEMS = [
  {
    href: "/",
    label: "Read",
    matches: (pathname: string) => pathname === "/" || pathname.startsWith("/posts")
  },
  {
    href: "/resume",
    label: "Resume",
    matches: (pathname: string) => pathname === "/resume"
  }
] as const;

const publicLinks = getPublicLinks();

const SOCIAL_LINKS: Array<{ href: string; label: string; Icon: LucideIcon }> = [
  {
    href: publicLinks.githubProfile,
    label: "GitHub",
    Icon: Github
  },
  {
    href: publicLinks.linkedInProfile,
    label: "LinkedIn",
    Icon: Linkedin
  }
];

const HEADER_SURFACE_CLASS =
  "sticky top-0 z-30 overflow-hidden border-b bg-background/[0.97] text-foreground transition-[background-color,border-color,box-shadow] duration-300 dark:bg-background/[0.98]";

const navLinkClass = (isActive: boolean, isMobile = false) =>
  cn(
    "relative px-3 py-1.5 text-foreground/70 transition-[color] duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
    isMobile && "flex min-h-11 items-center border-b border-border/55 px-0 py-2.5 text-[11px]",
    isActive && "text-foreground font-semibold"
  );

function DesktopNav({ navLinks }: { navLinks: NavLink[] }) {
  return (
    <nav className="ml-1 hidden items-center gap-1 text-xs uppercase tracking-[0.18em] md:flex" aria-label="Main">
      {navLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={navLinkClass(item.isActive)}
          aria-current={item.isActive ? "page" : undefined}
        >
          {item.label}
          <span
            className={cn(
              "absolute bottom-0 left-3 right-3 h-px origin-left bg-accent transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
              item.isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            )}
            aria-hidden="true"
          />
        </Link>
      ))}
    </nav>
  );
}

function SocialIconLinks() {
  return (
    <div className="hidden items-center gap-0.5 micro:flex">
      {SOCIAL_LINKS.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-foreground/70 transition-[color,background-color] duration-200 hover:bg-foreground/8 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:h-9 sm:w-9 motion-reduce:transition-none"
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

function MobileNav({
  menuId,
  isMenuOpen,
  navLinks,
  onClose
}: {
  menuId: string;
  isMenuOpen: boolean;
  navLinks: NavLink[];
  onClose: () => void;
}) {
  return (
    <div
      id={menuId}
      aria-hidden={!isMenuOpen}
      inert={!isMenuOpen}
      className={cn(
        "overflow-hidden transition-[max-height,opacity,transform,padding] duration-300 ease-out md:hidden motion-reduce:transition-none",
        isMenuOpen
          ? "max-h-[22rem] opacity-100 pt-3"
          : "pointer-events-none max-h-0 -translate-y-1 opacity-0 motion-reduce:translate-y-0"
      )}
    >
      <div className="border-t border-border/70 pb-1">
      <nav aria-label="Mobile" className="grid">
        {navLinks.map((item) => (
          <Link
            key={`mobile-${item.href}`}
            href={item.href}
            className={cn(navLinkClass(item.isActive, true), item.isActive && "text-accent")}
            aria-current={item.isActive ? "page" : undefined}
            tabIndex={isMenuOpen ? undefined : -1}
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Mobile social links" className="grid grid-cols-2 gap-x-5">
        {SOCIAL_LINKS.map(({ href, label }) => (
          <a
            key={`mobile-social-${href}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            tabIndex={isMenuOpen ? undefined : -1}
            className="inline-flex min-h-11 items-center justify-between border-b border-border/55 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {label}
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>
      </div>
    </div>
  );
}

export default function PublicHeader() {
  const pathname = usePathname();
  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks: NavLink[] = NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    isActive: item.matches(pathname)
  }));

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

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-public-header="true"
      className={cn(
        HEADER_SURFACE_CLASS,
        isScrolled
          ? "border-border/75 shadow-[0_1px_16px_rgba(36,30,24,0.1)] dark:shadow-[0_1px_18px_rgba(0,0,0,0.34)]"
          : "border-border/40"
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-foreground/10"
        aria-hidden="true"
      />
      <div className="journal-canvas relative z-10 py-2.5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/" className="min-w-0 truncate font-mono text-[13px] font-semibold tracking-[-0.02em] sm:text-sm">
            meettilavat.com
          </Link>
          <div className="hidden h-[18px] w-px bg-border sm:block" aria-hidden="true" />
          <DesktopNav navLinks={navLinks} />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <SocialIconLinks />
            <ThemeToggle className="h-11 w-11 rounded-sm border-0 bg-transparent text-foreground/70 hover:bg-foreground/8 hover:text-foreground sm:h-9 sm:w-9" />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border/70 bg-card text-foreground transition-[background-color,color,border-color] duration-200 hover:border-foreground/40 hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:hidden motion-reduce:transition-none"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls={menuId}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <MobileNav
          menuId={menuId}
          isMenuOpen={isMenuOpen}
          navLinks={navLinks}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </header>
  );
}
