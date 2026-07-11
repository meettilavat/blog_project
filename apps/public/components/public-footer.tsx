import Link from "next/link";
import { getPublicLinks } from "@/lib/public-links";

export function PublicFooter() {
  const year = new Date().getFullYear();
  const publicLinks = getPublicLinks();

  return (
    <footer className="border-t border-border/50 bg-card/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-xs text-foreground/60">
          &copy; {year} Meet Tilavat
        </p>
        <nav className="flex items-center gap-3 text-xs text-foreground/60" aria-label="Footer">
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
        <p className="text-[11px] text-foreground/55">
          Built with Next.js &amp; Tailwind
        </p>
      </div>
    </footer>
  );
}

export default PublicFooter;
