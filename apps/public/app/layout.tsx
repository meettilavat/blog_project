import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import "../../../styles/globals.css";
import { IBM_Plex_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/ui/classnames";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import {
  AUTHOR_NAME,
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  PUBLIC_SITE_LOCALE,
  PUBLIC_SITE_NAME,
  PUBLIC_SITE_TITLE_TEMPLATE
} from "@/lib/seo/public-site";
import PublicHeader from "../components/public-header";
import PublicFooter from "../components/public-footer";
import { UiEnvironmentProvider } from "@/components/ui/ui-environment";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const publicThemeScriptPath = path.join(process.cwd(), "public/scripts/theme-public.js");
const repoThemeScriptPath = path.join(process.cwd(), "apps/public/public/scripts/theme-public.js");
const themeBootstrapScript = readFileSync(
  existsSync(publicThemeScriptPath) ? publicThemeScriptPath : repoThemeScriptPath,
  "utf8"
);

const LIGHT_THEME_COLOR = "#F7F7F5";
const DARK_THEME_COLOR = "#0B0D10";
const configuredSiteUrl = getConfiguredSiteUrl();
const metadataBase = configuredSiteUrl ? new URL(configuredSiteUrl) : undefined;

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-body"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-display"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase,
  applicationName: PUBLIC_SITE_NAME,
  title: {
    default: PUBLIC_SITE_NAME,
    template: PUBLIC_SITE_TITLE_TEMPLATE
  },
  description: HOME_PAGE_DESCRIPTION,
  authors: [{ name: AUTHOR_NAME, url: "/resume" }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: PUBLIC_SITE_LOCALE,
    url: configuredSiteUrl ?? undefined,
    title: PUBLIC_SITE_NAME,
    description: HOME_PAGE_DESCRIPTION,
    siteName: PUBLIC_SITE_NAME,
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE_PATH,
        alt: DEFAULT_SOCIAL_IMAGE_ALT,
        width: 1200,
        height: 630
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: PUBLIC_SITE_NAME,
    description: HOME_PAGE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE_PATH]
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
      data-scroll-behavior="smooth"
      className={cn(newsreader.variable, spaceGrotesk.variable, plexMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="alternate" type="application/rss+xml" title="Meet Tilavat" href="/feed.xml" />
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
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased transition-colors">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <UiEnvironmentProvider>
          <a
            href="#content"
            className="sr-only rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background shadow-soft focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Skip to content
          </a>
          <div className="relative flex min-h-dvh flex-col">
            <PublicHeader />
            <main id="content" className="site-canvas flex flex-1 flex-col pb-24 pt-[clamp(2.5rem,5vw,5.5rem)]">
              {children}
            </main>
            <PublicFooter />
          </div>
        </UiEnvironmentProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
