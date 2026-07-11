import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const HTTPS_PROTOCOL = "https://";
const SOURCE_REPOSITORY = [HTTPS_PROTOCOL, "github.com", "/meettilavat/blog_project"].join("");

vi.mock("@/lib/public-links", () => ({
  getPublicLinks: () => ({
    sourceRepository: SOURCE_REPOSITORY
  })
}));

import { PublicFooter } from "./public-footer";

describe("apps/public/components/public-footer.tsx", () => {
  it("renders the footer links and current year", () => {
    const currentYear = String(new Date().getFullYear());
    const html = renderToStaticMarkup(<PublicFooter />);

    expect(html).toContain(`© ${currentYear} Meet Tilavat`);
    expect(html).toContain(">Read<");
    expect(html).toContain(">Resume<");
    expect(html).toContain(">Source<");
    expect(html).toContain(SOURCE_REPOSITORY);
    expect(html).toContain("Engineer&#x27;s field journal");
    expect(html).not.toContain("Built with Next.js &amp; Tailwind");
    expect(html).toContain("text-foreground/70");
    expect(html).not.toContain("text-foreground/55");
    expect(html).not.toContain("text-foreground/35");
  });
});
