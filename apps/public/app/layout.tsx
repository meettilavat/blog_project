import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import "../../../styles/globals.css";
import { Source_Sans_3, Fraunces, IBM_Plex_Mono } from "next/font/google";
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

const LIGHT_THEME_COLOR = "#f6f2ea";
const DARK_THEME_COLOR = "#15120f";
const configuredSiteUrl = getConfiguredSiteUrl();
const metadataBase = configuredSiteUrl ? new URL(configuredSiteUrl) : undefined;

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
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <UiEnvironmentProvider>
          <a
            href="#content"
            className="sr-only rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background shadow-soft focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Skip to content
          </a>
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-35 dark:opacity-20" aria-hidden="true">
            <div className="grid-ruled h-full w-full" />
          </div>
          <div className="relative">
            <PublicHeader />
            <main id="content" className="container pb-20 pt-10">
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
