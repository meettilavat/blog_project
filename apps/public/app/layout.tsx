import type { Metadata } from "next";
import "../../../styles/globals.css";
import { Source_Sans_3, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import PublicHeader from "../components/public-header";

const LIGHT_THEME_COLOR = "#f6f2ea";
const DARK_THEME_COLOR = "#15120f";

const themeScript = `
(() => {
  try {
    const root = document.documentElement;
    const THEME_COLORS = { light: '${LIGHT_THEME_COLOR}', dark: '${DARK_THEME_COLOR}' };
    const applyTheme = (theme) => {
      root.classList.toggle('dark', theme === 'dark');
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      const meta = document.querySelector('meta[name="theme-color"][data-dynamic-theme]');
      if (meta) {
        meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light);
      }
    };
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);

    document.addEventListener('click', (event) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest('[data-theme-toggle]') : null;
      if (!button) return;
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
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

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://meettilavat.com"),
  title: {
    default: "Meet Tilavat",
    template: "%s — Meet Tilavat"
  },
  description: "Meet Tilavat — software engineer portfolio and writing.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "https://meettilavat.com",
    title: "Meet Tilavat",
    description: "Software engineer portfolio and blog.",
    siteName: "meettilavat.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Tilavat",
    description: "Software engineer portfolio and blog."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-app="public"
      className={cn(sourceSans.variable, fraunces.variable, plexMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta
          name="theme-color"
          data-dynamic-theme
          content={LIGHT_THEME_COLOR}
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={LIGHT_THEME_COLOR}
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content={DARK_THEME_COLOR}
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors">
        <a
          href="#content"
          className="sr-only rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background shadow-soft focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Skip to content
        </a>
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-40" aria-hidden="true">
          <div className="grid-ruled h-full w-full" />
        </div>
        <div className="relative">
          <PublicHeader />
          <main id="content" className="container pb-20 pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
