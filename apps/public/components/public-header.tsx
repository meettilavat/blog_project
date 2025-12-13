import ThemeToggle from "@/components/theme-toggle";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl dark:bg-card/70">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <a href="/" className="text-lg font-semibold tracking-tight">
            meettilavat.com
          </a>
          <div className="h-[18px] w-[1px] bg-border" />
          <nav className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-foreground/80">
            <a
              href="/"
              className="group relative overflow-hidden rounded-full px-3 py-1 transition-transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
              <span className="relative z-10">Read</span>
            </a>
            <a
              href="/resume"
              className="group relative overflow-hidden rounded-full px-3 py-1 transition-transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
              <span className="relative z-10">Resume</span>
            </a>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
