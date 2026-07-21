import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AVAILABILITY_STATUS } from "@/lib/profile/availability";

const { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } = vi.hoisted(() => {
  const protocol = "https://";
  return {
    GITHUB_PROFILE_URL: [protocol, "github.com", "/meettilavat"].join(""),
    LINKEDIN_PROFILE_URL: [protocol, "www.linkedin.com", "/in/meettilavat"].join("")
  };
});

vi.mock("@/lib/public-links", () => ({
  getPublicLinks: () => ({
    githubProfile: GITHUB_PROFILE_URL,
    linkedInProfile: LINKEDIN_PROFILE_URL
  })
}));

vi.mock("lucide-react", () => ({
  Github: (props: Record<string, unknown>) => <svg data-icon="github" {...props} />,
  Linkedin: (props: Record<string, unknown>) => <svg data-icon="linkedin" {...props} />
}));

import { PublicFooter } from "./public-footer";

describe("apps/public/components/public-footer.tsx", () => {
  it("renders socials, location, availability, RSS, and the current year", () => {
    const currentYear = String(new Date().getFullYear());
    const html = renderToStaticMarkup(<PublicFooter />);

    expect(html).toContain(`© ${currentYear} Meet Tilavat`);
    expect(html).toContain("aria-label=\"GitHub\"");
    expect(html).toContain("aria-label=\"LinkedIn\"");
    expect(html).toContain(GITHUB_PROFILE_URL);
    expect(html).toContain(LINKEDIN_PROFILE_URL);
    expect(html).toContain("href=\"/feed.xml\"");
    expect(html).toContain("Gujarat, India · UTC+05:30");
    expect(html).toContain(AVAILABILITY_STATUS);
    expect(html).toContain("site-canvas");
    expect(html).toContain("text-foreground/70");
    expect(html).not.toContain("journal-canvas");
    expect(html).not.toContain("field journal");
    expect(html).not.toContain("issue ongoing");
    expect(html).not.toContain("text-foreground/55");
    expect(html).not.toContain("text-foreground/35");
  });
});
