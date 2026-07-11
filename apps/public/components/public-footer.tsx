import Link from "next/link";
import { getPublicLinks } from "@/lib/public-links";

export function PublicFooter() {
  const year = new Date().getFullYear();
  const publicLinks = getPublicLinks();

  return (
    <footer data-public-footer="true" className="border-t border-border/70 bg-background">
      <div className="journal-canvas grid gap-4 py-7 text-foreground/70 sm:grid-cols-[1fr_auto] sm:items-end lg:grid-cols-[1fr_auto_1fr]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70">
          &copy; {year} Meet Tilavat
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 text-xs text-foreground/70" aria-label="Footer">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center px-1 transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Read
          </Link>
          <Link
            href="/resume"
            className="inline-flex min-h-11 items-center px-1 transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Resume
          </Link>
          <a
            href={publicLinks.sourceRepository}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center px-1 transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Source
          </a>
        </nav>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/70 sm:col-span-2 lg:col-span-1 lg:text-right">
          Engineer&apos;s field journal · issue ongoing
        </p>
      </div>
    </footer>
  );
}

export default PublicFooter;
