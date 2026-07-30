import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  PUBLIC_SITE_NAME
} from "@/lib/seo/public-site";

const { SITE_URL } = vi.hoisted(() => {
  const protocol = "https://";
  const domain = "www.meettilavat.com";
  return {
    SITE_URL: `${protocol}${domain}`
  };
});

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => SITE_URL
}));

vi.mock("../../components/public-header", () => ({
  default: function PublicHeaderStub() {
    return <div>PublicHeaderStub</div>;
  }
}));

vi.mock("../../components/public-footer", () => ({
  default: function PublicFooterStub() {
    return <div>PublicFooterStub</div>;
  }
}));

vi.mock("@/components/ui/ui-environment", () => ({
  UiEnvironmentProvider: function UiEnvironmentProviderStub({
    children
  }: {
    children: React.ReactNode;
  }) {
    return <div data-ui-environment>{children}</div>;
  }
}));

import RootLayout, { metadata } from "../layout";

describe("apps/public/app/layout.tsx", () => {
  it("exports expected metadata", () => {
    expect(metadata.applicationName).toBe(PUBLIC_SITE_NAME);
    expect(metadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(metadata.description).toBe(HOME_PAGE_DESCRIPTION);
    expect(metadata.authors).toEqual([{ name: PUBLIC_SITE_NAME, url: "/resume" }]);
    expect(metadata.robots).toEqual({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    });
    expect(metadata.openGraph?.url).toBe(SITE_URL);
    expect(metadata.openGraph?.siteName).toBe(PUBLIC_SITE_NAME);
    expect(metadata.openGraph?.images).toEqual([
      {
        url: DEFAULT_SOCIAL_IMAGE_PATH,
        alt: "Meet Tilavat — software engineer portfolio, resume, and writing.",
        width: 1200,
        height: 630
      }
    ]);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.twitter?.images).toEqual([DEFAULT_SOCIAL_IMAGE_PATH]);
  });

  it("renders public shell around page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>ChildContentStub</div>
      </RootLayout>
    );

    expect(html).toContain("data-app=\"public\"");
    expect(html).toContain("data-scroll-behavior=\"smooth\"");
    expect(html).toContain("Skip to content");
    expect(html).toContain("PublicHeaderStub");
    expect(html).toContain("PublicFooterStub");
    expect(html).toContain("ChildContentStub");
    expect(html).toContain("id=\"content\"");
    expect(html).toContain("min-h-dvh");
    expect(html).toContain("flex-col");
    expect(html).toContain("flex-1");
    expect(html).toContain("site-canvas");
    expect(html).toContain("flex flex-1 flex-col");
    expect(html).toContain("localStorage.getItem(\"theme\")");
    expect(html).toContain("name=\"theme-color\"");
    expect(html).toContain("--font-display");
    expect(html).toContain("--font-body-italic");
    expect(html).not.toContain("--font-serif");
    expect(html).toContain('content="#F7F7F5"');
    expect(html).toContain('content="#0B0D10"');
    expect(html).toContain('type="application/rss+xml"');
    expect(html).not.toContain("grid-ruled");
  });
});

// `preload` is only observable in the emitted <link> tags, so this asserts on source.
// It guards the one tempting simplification: folding the two Newsreader calls back
// into a single `style: ["normal", "italic"]`, which silently restores a 64.5 KB
// High-priority preload for a face nothing above the fold renders.
//
// No CSS binding is needed to keep `<em>` on the real italic. Both calls generate the
// same family name, so the italic @font-face merges into the family the body already
// inherits and normal face matching finds it. Verified in Chromium against a
// production build with no such rule present: `<em>` fetched
// 9433d1a810498265-s.<hash>.woff2 on demand — the non-preload variant of the same
// file — and document.fonts reported a loaded italic Newsreader face. An earlier
// version of this suite asserted a globals.css rule was load-bearing here; it was
// redundant, and only a probe showed that.
describe("public italic font strategy", () => {
  // Comments are stripped so these assert on code. The prose above the declarations
  // names the very patterns being matched, which would otherwise satisfy the positive
  // checks and defeat the negative one outright.
  const stripComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  const layout = stripComments(
    readFileSync(resolve(process.cwd(), "apps/public/app/layout.tsx"), "utf8")
  );

  it("declares the italic cut separately and keeps it off the preload path", () => {
    expect(layout).toContain('style: ["italic"]');
    expect(layout).toContain("preload: false");
    // The upright face must not re-absorb italic; that is what forces the preload.
    expect(layout).not.toContain('style: ["normal", "italic"]');
  });

  it("keeps the italic declaration applied so its @font-face is retained", () => {
    expect(layout).toContain("newsreaderItalic.variable");
  });
});
