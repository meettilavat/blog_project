import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { SITE_URL } = vi.hoisted(() => {
  const protocol = "https://";
  const domain = "meettilavat.com";
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
    expect(metadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(metadata.description).toBe("Meet Tilavat — software engineer portfolio and writing.");
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe(SITE_URL);
    expect(metadata.twitter?.card).toBe("summary_large_image");
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
