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
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.twitter?.images).toEqual([DEFAULT_SOCIAL_IMAGE_PATH]);
  });

  it("renders public shell around page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>ChildContentStub</div>
      </RootLayout>
    );

    expect(html).toContain("data-app=\"public\"");
    expect(html).toContain("Skip to content");
    expect(html).toContain("PublicHeaderStub");
    expect(html).toContain("PublicFooterStub");
    expect(html).toContain("ChildContentStub");
    expect(html).toContain("id=\"content\"");
    expect(html).toContain("/scripts/theme-public.js");
    expect(html).toContain("name=\"theme-color\"");
  });
});
