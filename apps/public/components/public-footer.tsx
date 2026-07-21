import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { getPublicLinks } from "@/lib/public-links";
import { AVAILABILITY_STATUS } from "@/lib/profile/availability";

export function PublicFooter() {
  const year = new Date().getFullYear();
  const publicLinks = getPublicLinks();

  return (
    <footer data-public-footer="true" className="border-t border-border/70 bg-background">
      <div className="site-canvas grid gap-4 py-7 text-foreground/70 sm:grid-cols-[1fr_auto] sm:items-end">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]">© {year} Meet Tilavat</p>
        <nav className="flex flex-wrap items-center gap-x-5 text-xs" aria-label="Footer">
          <a href={publicLinks.githubProfile} target="_blank" rel="noreferrer" aria-label="GitHub" className="inline-flex min-h-11 items-center gap-2 px-1 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
            <Github className="h-4 w-4" aria-hidden="true" /> GitHub
          </a>
          <a href={publicLinks.linkedInProfile} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="inline-flex min-h-11 items-center gap-2 px-1 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
            <Linkedin className="h-4 w-4" aria-hidden="true" /> LinkedIn
          </a>
          <Link href="/feed.xml" className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">RSS</Link>
        </nav>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] sm:col-span-2">
          Gujarat, India · UTC+05:30 · {AVAILABILITY_STATUS}
        </p>
      </div>
    </footer>
  );
}

export default PublicFooter;
