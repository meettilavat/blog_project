import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { getOptionalCurrentUserSession } from "@/lib/services/current-user-service";
import ThemeToggle from "@/components/layout/theme-toggle";

export default async function Header() {
  const session = await getOptionalCurrentUserSession();
  const isAuthenticated = session.ok && Boolean(session.user);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl dark:bg-card/70">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            meettilavat.com
          </Link>
          <div className="h-[18px] w-[1px] bg-border" />
          <nav className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-foreground/80">
            <Link
              href="/resume"
              className="group relative overflow-hidden rounded-full px-3 py-1 transition transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
              <span className="relative z-10">Resume</span>
            </Link>
            <Link
              href="/"
              className="group relative overflow-hidden rounded-full px-3 py-1 transition transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
              <span className="relative z-10">Read</span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="group relative overflow-hidden rounded-full px-3 py-1 transition transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <span className="absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
                  <span className="relative z-10">Dashboard</span>
                </Link>
                <Link
                  href="/editor/new"
                  className="group relative overflow-hidden rounded-full px-3 py-1 transition transform hover:translate-y-[-1px] active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <span className="absolute inset-0 scale-0 rounded-full bg-foreground/15 opacity-0 transition duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />
                  <span className="relative z-10">Create</span>
                </Link>
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="uppercase tracking-[0.18em]"
              >
                Sign out
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="uppercase tracking-[0.18em]">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
