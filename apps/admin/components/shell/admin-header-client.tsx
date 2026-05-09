"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Menu, type LucideIcon, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import ThemeToggle from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { getPublicLinks } from "@/lib/public-links";
import { cn } from "@/lib/ui/classnames";

type SignOutAction = () => Promise<void>;

type AdminHeaderClientProps = {
  isAuthenticated: boolean;
  signOutAction: SignOutAction;
};

type NavLink = {
  href: string;
  label: string;
  isActive: boolean;
};

type NavItem = {
  href: string;
  label: string;
  requiresAuth?: boolean;
  matches: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Read",
    matches: (pathname) => pathname === "/" || pathname.startsWith("/posts")
  },
  {
    href: "/resume",
    label: "Resume",
    matches: (pathname) => pathname === "/resume"
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    requiresAuth: true,
    matches: (pathname) => pathname === "/dashboard"
  },
  {
    href: "/editor/new",
    label: "Create",
    requiresAuth: true,
    matches: (pathname) => pathname.startsWith("/editor")
  }
];

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
  "sticky top-0 z-30 overflow-hidden border-b bg-background/92 text-foreground backdrop-blur-2xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300 dark:bg-background/94";

const navLinkClass = (isActive: boolean, isMobile = false) =>
  cn(
    "relative px-3 py-1.5 text-foreground/70 transition-[color] duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
    isMobile && "block rounded-xl px-3 py-2.5 text-[11px]",
    isActive && "font-semibold text-foreground"
  );

function buildNavLinks(pathname: string, isAuthenticated: boolean): NavLink[] {
  return NAV_ITEMS.filter((item) => !item.requiresAuth || isAuthenticated).map((item) => ({
    href: item.href,
    label: item.label,
    isActive: item.matches(pathname)
  }));
}

function DesktopNav({ navLinks }: { navLinks: NavLink[] }) {
  return (
    <nav
      className="ml-1 hidden items-center gap-1 text-xs uppercase tracking-[0.18em] md:flex"
      aria-label="Main"
    >
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
              "absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-accent transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
              item.isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            )}
            aria-hidden="true"
          />
        </Link>
      ))}
    </nav>
  );
}

function SocialLinks() {
  return (
    <div className="flex items-center gap-1">
      {SOCIAL_LINKS.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 transition-[color,background-color] duration-200 hover:bg-foreground/8 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none"
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </a>
      ))}
      <ThemeToggle className="h-8 w-8 border-0 bg-transparent text-foreground/50 hover:bg-foreground/8 hover:text-foreground" />
    </div>
  );
}

function AuthAction({
  isAuthenticated,
  signOutAction,
  isMobile = false
}: AdminHeaderClientProps & { isMobile?: boolean }) {
  if (isAuthenticated) {
    return (
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className={cn(
            "uppercase tracking-[0.18em]",
            isMobile && "h-10 w-full justify-center"
          )}
        >
          Sign out
        </Button>
      </form>
    );
  }

  return (
    <Link href="/login" className={cn(isMobile && "block")}>
      <Button
        variant="ghost"
        size="sm"
        className={cn("uppercase tracking-[0.18em]", isMobile && "h-10 w-full")}
      >
        Login
      </Button>
    </Link>
  );
}

function MobileNav({
  menuId,
  isMenuOpen,
  navLinks,
  isAuthenticated,
  signOutAction,
  onClose
}: AdminHeaderClientProps & {
  menuId: string;
  isMenuOpen: boolean;
  navLinks: NavLink[];
  onClose: () => void;
}) {
  return (
    <div
      id={menuId}
      role="navigation"
      aria-label="Mobile navigation"
      className={cn(
        "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out md:hidden motion-reduce:transition-none",
        isMenuOpen
          ? "max-h-96 opacity-100 pt-3"
          : "pointer-events-none max-h-0 -translate-y-1 opacity-0 motion-reduce:translate-y-0"
      )}
    >
      <nav
        aria-label="Primary"
        className="grid gap-2 rounded-2xl border border-border/70 bg-card/90 p-2 shadow-soft"
      >
        {navLinks.map((item) => (
          <Link
            key={`mobile-${item.href}`}
            href={item.href}
            className={cn(navLinkClass(item.isActive, true), item.isActive && "rounded-xl bg-muted")}
            aria-current={item.isActive ? "page" : undefined}
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}
        <div className="border-t border-border/60 p-2">
          <AuthAction
            isAuthenticated={isAuthenticated}
            signOutAction={signOutAction}
            isMobile
          />
        </div>
      </nav>
    </div>
  );
}

export default function AdminHeaderClient({
  isAuthenticated,
  signOutAction
}: AdminHeaderClientProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navLinks = buildNavLinks(pathname, isAuthenticated);

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
      className={cn(
        HEADER_SURFACE_CLASS,
        isScrolled
          ? "border-border/75 shadow-[0_1px_16px_rgba(36,30,24,0.1)] dark:shadow-[0_1px_18px_rgba(0,0,0,0.34)]"
          : "border-border/40"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-background/82 shadow-[inset_0_-1px_0_rgb(255_255_255_/_0.08)] dark:bg-background/86"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-foreground/10"
        aria-hidden="true"
      />
      <div className="container relative z-10 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="text-base font-semibold tracking-tight sm:text-lg">
            meettilavat.com
          </Link>
          <div className="hidden h-[18px] w-px bg-border sm:block" aria-hidden="true" />
          <DesktopNav navLinks={navLinks} />
          <div className="ml-auto flex items-center gap-3">
            <SocialLinks />
            <div className="hidden md:block">
              <AuthAction
                isAuthenticated={isAuthenticated}
                signOutAction={signOutAction}
              />
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-[background-color,color,border-color] duration-200 hover:border-foreground/40 hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:hidden motion-reduce:transition-none"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls={menuId}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <MobileNav
          menuId={menuId}
          isMenuOpen={isMenuOpen}
          navLinks={navLinks}
          isAuthenticated={isAuthenticated}
          signOutAction={signOutAction}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </header>
  );
}
