import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL, SOURCE_REPOSITORY_URL } = vi.hoisted(() => {
  const protocol = "https://";
  return {
    GITHUB_PROFILE_URL: [protocol, "github.com", "/meettilavat"].join(""),
    LINKEDIN_PROFILE_URL: [protocol, "www.linkedin.com", "/in/meettilavat"].join(""),
    SOURCE_REPOSITORY_URL: [protocol, "github.com", "/meettilavat/blog_project"].join("")
  };
});

vi.mock("@/lib/public-links", () => ({
  getPublicLinks: () => ({
    githubProfile: GITHUB_PROFILE_URL,
    linkedInProfile: LINKEDIN_PROFILE_URL,
    sourceRepository: SOURCE_REPOSITORY_URL
  })
}));

vi.mock("lucide-react", () => ({
  ArrowUpRight: ({ className }: { className?: string }) => <svg className={className} data-icon="arrow-up-right" />,
  Github: ({ className }: { className?: string }) => <svg className={className} data-icon="github" />,
  Linkedin: ({ className }: { className?: string }) => <svg className={className} data-icon="linkedin" />,
  Mail: ({ className }: { className?: string }) => <svg className={className} data-icon="mail" />,
  MapPin: ({ className }: { className?: string }) => <svg className={className} data-icon="map-pin" />,
  Phone: ({ className }: { className?: string }) => <svg className={className} data-icon="phone" />
}));

vi.mock("@/components/profile/reveal-section", () => ({
  RevealSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

import ResumePage from "./resume-page";

describe("components/profile/resume-page.tsx", () => {
  it("renders resume content sections and public links", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain("Software engineer building dependable web products and systems.");
    expect(html).toContain("Experience");
    expect(html).toContain("Education");
    expect(html).toContain("Selected Projects");
    expect(html).toContain("Skills");
    expect(html).toContain("MeetTilavat.com (Blog Platform)");
    expect(html).toContain("linkedin.com/in/meettilavat");
    expect(html).toContain("github.com/meettilavat");
    expect(html).toContain("tilavatmeet2@gmail.com");
    expect(html).toContain(SOURCE_REPOSITORY_URL);
  });
});
