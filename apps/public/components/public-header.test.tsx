import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL, SOURCE_REPOSITORY_URL } = vi.hoisted(() => {
  const protocol = "https://";
  return {
    GITHUB_PROFILE_URL: [protocol, "github.com", "/meettilavat"].join(""),
    LINKEDIN_PROFILE_URL: [protocol, "www.linkedin.com", "/in/meettilavat"].join(""),
    SOURCE_REPOSITORY_URL: [protocol, "github.com", "/meettilavat/blog_project"].join("")
  };
});

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname
}));

vi.mock("lucide-react", () => ({
  Github: (props: Record<string, unknown>) => <svg data-icon="github" {...props} />,
  Linkedin: (props: Record<string, unknown>) => <svg data-icon="linkedin" {...props} />,
  Menu: (props: Record<string, unknown>) => <svg data-icon="menu" {...props} />,
  X: (props: Record<string, unknown>) => <svg data-icon="x" {...props} />
}));

vi.mock("@/components/layout/theme-toggle", () => ({
  default: ({ className }: { className?: string }) => (
    <button className={className}>ThemeToggleStub</button>
  )
}));

vi.mock("@/lib/public-links", () => ({
  getPublicLinks: () => ({
    githubProfile: GITHUB_PROFILE_URL,
    linkedInProfile: LINKEDIN_PROFILE_URL,
    sourceRepository: SOURCE_REPOSITORY_URL
  })
}));

import PublicHeader from "./public-header";

describe("apps/public/components/public-header.tsx", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("renders brand, nav links, social links, and menu controls", () => {
    const html = renderToStaticMarkup(<PublicHeader />);

    expect(html).toContain("meettilavat.com");
    expect(html).toContain(">Read<");
    expect(html).toContain(">Resume<");
    expect(html).toContain("aria-label=\"GitHub\"");
    expect(html).toContain("aria-label=\"LinkedIn\"");
    expect(html).toContain("ThemeToggleStub");
    expect(html).toContain("Open navigation menu");
    expect(html).toContain(GITHUB_PROFILE_URL);
    expect(html).toContain(LINKEDIN_PROFILE_URL);
    expect(html).toContain("aria-current=\"page\" href=\"/\">Read");
  });

  it("marks resume as active when pathname is /resume", () => {
    pathname = "/resume";

    const html = renderToStaticMarkup(<PublicHeader />);

    expect(html).toContain("aria-current=\"page\" href=\"/resume\">Resume");
    expect(html).not.toContain("aria-current=\"page\" href=\"/\">Read");
  });
});
