import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/public-links", () => ({
  getPublicLinks: () => ({
    githubProfile: "https://github.com/meettilavat",
    linkedInProfile: "https://www.linkedin.com/in/meettilavat",
    sourceRepository: "https://github.com/meettilavat/blog_project"
  })
}));

import {
  RESUME_NAME,
  RESUME_ROLE,
  RESUME_STANDFIRST,
  actionLinks,
  contactRows,
  earlierWork,
  education,
  experience,
  selectedWork,
  skillGroups
} from "./resume-data";

describe("lib/profile/resume-data.ts", () => {
  it("names the owner and states a role separate from the standfirst", () => {
    expect(RESUME_NAME).toBe("Meet Tilavat");
    expect(RESUME_ROLE).toBe("Software engineer");
    expect(RESUME_STANDFIRST).toContain("end-to-end");
    // The old marketing headline must not survive as the standfirst.
    expect(RESUME_STANDFIRST).not.toBe(
      "Software engineer building dependable web products and systems."
    );
  });

  it("labels selected work by status rather than by index", () => {
    expect(selectedWork.map((entry) => entry.label)).toEqual([
      "Production",
      "Production",
      "Research"
    ]);
    for (const entry of selectedWork) {
      expect(entry.label).not.toMatch(/^\d+$/);
    }
  });

  it("collapses the three superseded projects into earlier work", () => {
    expect(earlierWork).toHaveLength(3);
    const joined = earlierWork.join(" ");
    expect(joined).toContain("Image caption generator");
    expect(joined).toContain("Student performance");
    expect(joined).toContain("PHP/MySQL");
    // None of them may also appear as a full entry.
    const titles = selectedWork.map((entry) => entry.title).join(" ");
    expect(titles).not.toContain("Image caption");
    expect(titles).not.toContain("Personal Blog");
  });

  it("drops the skill groups that do not differentiate an engineer", () => {
    const labels = skillGroups.map((group) => group.label);
    expect(labels).toEqual(["Languages", "Frameworks", "Infra", "Data", "Spoken"]);
    const items = skillGroups.flatMap((group) => group.items).join(" ");
    expect(items).not.toContain("VS Code");
    expect(items).not.toContain("Custom PC building");
  });

  it("lists each contact value exactly once across rows and actions", () => {
    const rowValues = contactRows.map((row) => row.value).join(" ");
    const actionHrefs = actionLinks.map((link) => link.href).join(" ");

    // Three single-column rows; a second column would add a fourth left edge.
    expect(contactRows.map((row) => row.label)).toEqual(["Base", "Email", "Phone"]);
    expect(rowValues).toContain("UTC+05:30");
    expect(rowValues).toContain("tilavatmeet2@gmail.com");
    expect(rowValues).toContain("+91 99133 20031");
    // LinkedIn and GitHub live only in the actions.
    expect(rowValues).not.toContain("linkedin.com");
    expect(rowValues).not.toContain("github.com");
    expect(actionHrefs).toContain("linkedin.com/in/meettilavat");
    expect(actionHrefs).toContain("github.com/meettilavat");
    // There is no second "Email me" entry point.
    expect(actionLinks.map((link) => link.label)).toEqual([
      "Download PDF",
      "LinkedIn",
      "GitHub"
    ]);
  });

  it("keeps the case-study link pointing at the featured post", () => {
    const caseStudy = selectedWork[0]?.link;
    expect(caseStudy?.href).toBe(
      "/posts/building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp"
    );
    expect(caseStudy?.external).toBeFalsy();
  });
});
