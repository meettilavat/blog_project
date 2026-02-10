import Link from "next/link";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-card/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-xs text-foreground/45">
          &copy; {year} Meet Tilavat
        </p>
        <nav className="flex items-center gap-5 text-xs text-foreground/45" aria-label="Footer">
          <Link
            href="/"
            className="transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Read
          </Link>
          <Link
            href="/resume"
            className="transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Resume
          </Link>
          <a
            href="https://github.com/meettilavat/blog_project"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Source
          </a>
        </nav>
        <p className="text-[11px] text-foreground/35">
          Built with Next.js &amp; Tailwind
        </p>
      </div>
    </footer>
  );
}

export default PublicFooter;
