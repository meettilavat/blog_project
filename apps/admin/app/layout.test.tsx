import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/apps/admin/components/shell/header", () => ({
  default: function HeaderStub() {
    return <div>HeaderStub</div>;
  }
}));

vi.mock("@/apps/admin/components/shell/typography-toggle", () => ({
  default: function TypographyToggleStub() {
    return <div>TypographyToggleStub</div>;
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

import RootLayout, { metadata } from "./layout";

describe("apps/admin/app/layout.tsx", () => {
  it("exports expected metadata for the admin app", () => {
    expect(metadata.title).toBe("meettilavat.com — Portfolio & Blog");
    expect(metadata.description).toContain("portfolio");
    expect(metadata.description).toContain("Next.js");
  });

  it("renders shell chrome around child content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>ChildContentStub</div>
      </RootLayout>
    );

    expect(html).toContain("data-app=\"admin\"");
    expect(html).toContain("Skip to content");
    expect(html).toContain("HeaderStub");
    expect(html).toContain("TypographyToggleStub");
    expect(html).toContain("ChildContentStub");
    expect(html).toContain("id=\"content\"");
    expect(html).toContain("/scripts/theme-admin.js");
  });
});
