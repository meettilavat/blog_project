import type { Metadata } from "next";
import "../../../styles/globals.css";
import { Space_Grotesk, Literata, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/header";
import { cn } from "@/lib/utils";
import TypographyToggle from "@/components/typography-toggle";

const themeScript = `
(() => {
  try {
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    document.addEventListener('click', (event) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest('[data-theme-toggle]') : null;
      if (!button) return;
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      root.classList.toggle('dark', next === 'dark');
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
})();
`;

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk"
});

const newsreader = Literata({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--font-serif"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "meettilavat.com — Portfolio & Blog",
  description:
    "Meet Tilavat — portfolio, projects, and a bespoke writing experience built with Next.js and Supabase."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeSupabase = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
  const runtimeSupabaseJson = JSON.stringify(runtimeSupabase).replace(/</g, "\\u003c");

  return (
    <html
      lang="en"
      className={cn(grotesk.variable, newsreader.variable, plexMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="min-h-screen bg-background text-foreground antialiased transition-colors"
        data-typestyle="sans"
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__MEETTILAVAT_SUPABASE__ = ${runtimeSupabaseJson};`
          }}
        />
        <a
          href="#content"
          className="sr-only rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background shadow-soft focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:outline-none"
        >
          Skip to content
        </a>
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-40" aria-hidden="true">
          <div className="grid-ruled h-full w-full" />
        </div>
        <div className="relative">
          <Header />
          <div className="container flex items-center justify-end pt-2">
            <TypographyToggle />
          </div>
          <main id="content" className="container pb-20 pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
