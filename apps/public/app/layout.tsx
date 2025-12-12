import type { Metadata } from "next";
import "../../../styles/globals.css";
import { Space_Grotesk, Literata, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import PublicHeader from "../components/public-header";

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
    <html lang="en" className={cn(grotesk.variable, newsreader.variable, plexMono.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors">
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
          <PublicHeader />
          <main id="content" className="container pb-20 pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
