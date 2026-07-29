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
  ArrowUpRight: ({ className }: { className?: string }) => (
    <svg className={className} data-icon="arrow-up-right" />
  ),
  Download: ({ className }: { className?: string }) => (
    <svg className={className} data-icon="download" />
  )
}));

import ResumePage from "./resume-page";

describe("components/profile/resume-page.tsx", () => {
  it("makes the owner's name the only h1", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    const h1Count = html.split("<h1").length - 1;
    expect(h1Count).toBe(1);
    expect(html).toMatch(/<h1[^>]*>Meet Tilavat<\/h1>/);
    // The old 101px marketing headline is gone.
    expect(html).not.toContain("Software engineer building dependable web products and systems.");
    expect(html).not.toContain("6.35rem");
  });

  it("carries the standfirst and availability", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain("I build and run web products end-to-end");
    expect(html).toContain("Open to full-time roles");
    expect(html).toContain("Software engineer");
  });

  it("renders every section without index numbers", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain("Experience");
    expect(html).toContain("Education");
    expect(html).toContain("Selected work");
    expect(html).toContain("Skills");
    // No "01".."06" markers survive anywhere.
    expect(html).not.toMatch(/>\s*0[1-9]\s*</);
    expect(html).not.toContain("Fig. 01");
    expect(html).not.toContain("Selected Projects");
  });

  it("rides the shared ledger tracks rather than per-section grids", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain("resume-ledger");
    expect(html).toContain("resume-row");
    expect(html).toContain('data-resume-row="true"');
    expect(html).toContain('data-resume-section="true"');
    // The old competing grids and their hooks are gone.
    expect(html).not.toContain("data-resume-timeline");
    expect(html).not.toContain("data-resume-project");
    expect(html).not.toContain("data-resume-skill-group");
    expect(html).not.toContain("document:grid-cols-");
    expect(html).not.toContain("lg:grid-cols-");
    expect(html).not.toContain("max-w-[88rem]");
  });

  it("replaces the icon contact sidebar with ledger rows", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).not.toContain("<address");
    expect(html).not.toContain('data-icon="mail"');
    expect(html).not.toContain('data-icon="phone"');
    expect(html).not.toContain('data-icon="map-pin"');
    expect(html).toContain('href="mailto:tilavatmeet2@gmail.com"');
    expect(html).toContain('href="tel:+919913320031"');
    expect(html).toContain("UTC+05:30");
  });

  it("lists each contact destination exactly once", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html.split("tilavatmeet2@gmail.com").length - 1).toBe(2); // href + visible value
    // Anchored on the closing quote: the source-repository URL that "Selected
    // work" links to is GITHUB_PROFILE_URL + "/blog_project", so a bare
    // substring count would score that project link as a second contact entry.
    expect(html.split(`href="${LINKEDIN_PROFILE_URL}"`).length - 1).toBe(1);
    expect(html.split(`href="${GITHUB_PROFILE_URL}"`).length - 1).toBe(1);
    expect(html).not.toContain("Email Me");
  });

  it("labels work by status and collapses earlier projects", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain("Production");
    expect(html).toContain("Research");
    expect(html).toContain("Earlier");
    expect(html).toContain("Vriksha Ganana");
    expect(html).toContain("Image caption generator");
    expect(html).not.toContain("MeetTilavat.com (Blog Platform)");
    expect(html).toContain(SOURCE_REPOSITORY_URL);
    expect(html).toContain(
      'href="/posts/building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp"'
    );
  });

  it("keeps the PDF download and drops the retired skill groups", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain('href="/resume/meet-tilavat-resume.pdf"');
    expect(html).toContain('download="Meet_Tilavat_Resume.pdf"');
    expect(html).toContain("Download PDF");
    expect(html).not.toContain("VS Code");
    expect(html).not.toContain("Custom PC building");
  });

  it("stays effect-free and free of section subtitles", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).not.toContain("RevealSection");
    expect(html).not.toContain("journal-");
    expect(html).toContain("kicker");
    expect(html).toContain("font-display");
    expect(html).not.toContain("font-serif");
    // Subtitles that described their own heading are cut.
    expect(html).not.toContain("Hands-on product delivery");
    expect(html).not.toContain("Current stack and tools used in day-to-day delivery");
    expect(html).not.toContain("Core academics with strong engineering outcomes");
  });
});
