import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  RESUME_PAGE_DESCRIPTION,
  RESUME_PAGE_TITLE
} from "@/lib/seo/public-site";

const { SITE_URL } = vi.hoisted(() => ({
  SITE_URL: "https://www.meettilavat.com"
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => SITE_URL
}));

vi.mock("@/components/profile/resume-page", () => ({
  default: function ResumePageStub() {
    return <div>ResumePageStub</div>;
  }
}));

import Resume, { metadata } from "./page";

describe("apps/public/app/resume/page.tsx", () => {
  it("exports resume-specific metadata instead of falling back to the homepage defaults", () => {
    expect(metadata.title).toBe(RESUME_PAGE_TITLE);
    expect(metadata.description).toBe(RESUME_PAGE_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe("/resume");
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/resume`);
    expect(metadata.twitter?.images).toEqual([DEFAULT_SOCIAL_IMAGE_PATH]);
  });

  it("renders the resume page along with profile structured data", () => {
    const html = renderToStaticMarkup(<Resume />);

    expect(html).toContain("ResumePageStub");
    expect(html).toContain("application/ld+json");
    expect(html).toContain("\"@type\":\"ProfilePage\"");
    expect(html).toContain(`\"url\":\"${SITE_URL}/resume\"`);
  });
});
