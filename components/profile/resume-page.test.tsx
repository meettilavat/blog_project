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

/**
 * The markup of one ledger section, from its own `data-resume-section` marker to
 * the next one (or the end of the sheet). Slicing is what makes an assertion
 * about what a section must *not* contain mean anything: the stack keywords
 * banned from Skills are legitimately present under Selected work, so a
 * whole-document check would either fail wrongly or assert nothing.
 */
function sectionMarkup(html: string, heading: string): string {
  const marker = 'data-resume-section="true"';
  const bounds: number[] = [];
  for (let at = html.indexOf(marker); at !== -1; at = html.indexOf(marker, at + 1)) {
    bounds.push(at);
  }

  const headingAt = html.indexOf(`>${heading}</h2>`);
  expect(headingAt, `no <h2> found for section "${heading}"`).toBeGreaterThan(-1);

  const start = bounds.filter((at) => at < headingAt).pop() ?? 0;
  const end = bounds.find((at) => at > headingAt) ?? html.length;
  return html.slice(start, end);
}

/** Every `<a ...>` opening tag in `html`, in source order. */
function anchorTags(html: string): string[] {
  return html.match(/<a\s[^>]*>/g) ?? [];
}

/**
 * The class attribute of one opening tag, split into tokens.
 *
 * Tokens, not a substring of the tag: `toContain("hidden")` against raw tag text
 * is satisfied by `aria-hidden="true"`, and a `not.toContain` against raw text
 * can pass merely because the element was never found. An empty list is the
 * signal that a lookup missed, which the positive assertions at each call site
 * catch before any absence is asserted.
 */
function classTokens(tag: string): string[] {
  return (/\sclass="([^"]*)"/.exec(tag)?.[1] ?? "").split(/\s+/).filter(Boolean);
}

/** One entry per element carrying the `resume-row` class token. */
function ledgerRows(html: string): Array<{ tag: string; hasPrintHook: boolean }> {
  const rows: Array<{ tag: string; hasPrintHook: boolean }> = [];
  for (const [tag] of html.matchAll(/<[a-z][a-z0-9]*\s[^>]*>/gi)) {
    if (!classTokens(tag).includes("resume-row")) continue;
    rows.push({ tag, hasPrintHook: /\sdata-resume-row="true"/.test(tag) });
  }
  return rows;
}

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

  it("prints the profile links and hides only the download", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const anchors = anchorTags(html);
    const find = (href: string) => anchors.find((tag) => tag.includes(`href="${href}"`)) ?? "";

    const download = find("/resume/meet-tilavat-resume.pdf");
    const linkedIn = find(LINKEDIN_PROFILE_URL);
    const github = find(GITHUB_PROFILE_URL);

    // Each anchor was found and its class list parsed. Without this the three
    // absence checks below would all pass on empty lists.
    expect(classTokens(download)).toContain("inline-flex");
    expect(classTokens(linkedIn)).toContain("inline-flex");
    expect(classTokens(github)).toContain("inline-flex");

    // A paper resume should not advertise a download link...
    expect(classTokens(download)).toContain("print:hidden");
    // ...but LinkedIn and GitHub now live *only* in `actionLinks` — `contactRows`
    // was reduced to Base/Email/Phone — so hiding them prints a resume with no
    // way to reach either profile.
    expect(classTokens(linkedIn)).not.toContain("print:hidden");
    expect(classTokens(github)).not.toContain("print:hidden");

    // Exactly one element on the whole sheet hides on paper. Catches a wrapper
    // taking the class as well as the shared-anchor form this replaced, neither
    // of which the per-anchor checks above would see.
    expect(html.split("print:hidden").length - 1).toBe(1);
  });

  it("gives every ledger row the print break hook, not only some of them", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const rows = ledgerRows(html);

    // Five row shapes render here — section headings, entries, the earlier-work
    // note, skill groups, contact lines. Pinning a floor first means `every`
    // below cannot be satisfied by an empty or mis-parsed list.
    expect(rows.length).toBeGreaterThan(15);

    // `data-resume-row` is what the print `break-inside: avoid` rule keys on, so
    // a row that rides the two-track grid without it looks right on screen and
    // silently splits across a page break. Reported as the offending tags rather
    // than a boolean, so a failure names which shape forgot the hook.
    expect(rows.filter((row) => !row.hasPrintHook).map((row) => row.tag)).toEqual([]);
  });

  it("keeps the contact links at a thumb-sized tap target", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const anchors = anchorTags(html);

    for (const href of ["mailto:tilavatmeet2@gmail.com", "tel:+919913320031"]) {
      const tokens = classTokens(anchors.find((tag) => tag.includes(`href="${href}"`)) ?? "");

      // Found, and its class list parsed.
      expect(tokens, href).toContain("inline-flex");
      expect(tokens, href).toContain("items-center");
      // Without a floor the anchor is a text-sm inline box — a 20px-tall `tel:`
      // link. `min-h-11` is the 44px target every other link on the page keeps.
      expect(tokens, href).toContain("min-h-11");
    }
  });

  it("keeps project-stack keywords out of the skills list", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const skills = sectionMarkup(html, "Skills");

    // Establish the slice is a real, bounded window first: an empty or
    // mis-aimed slice would satisfy every absence check below for free.
    expect(skills).toContain("Languages");
    expect(skills).toContain("PostgreSQL/PostGIS");
    expect(skills.length).toBeLessThan(html.length);

    // These name one project's stack. They are not claimed as skills.
    expect(skills).not.toContain("Kotlin");
    expect(skills).not.toContain("Jetpack Compose");
    expect(skills).not.toContain("Tiptap");

    // ...and each really is on the page, so the three checks above are not
    // passing merely because the strings appear nowhere at all.
    expect(html).toContain("Kotlin");
    expect(html).toContain("Jetpack Compose");
    expect(html).toContain("Tiptap");
  });

  it("models skill groups as a definition list, like the contact rows", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const skills = sectionMarkup(html, "Skills");

    // Both label-plus-value sections are the same construct, so both are a <dl>.
    expect(skills).toMatch(/<dt class="kicker[^"]*">Languages<\/dt>/);
    expect(skills).toContain("<dd");
    expect(html.match(/<dl[\s>]/g) ?? []).toHaveLength(2);
    // The section's own kicker is a <span>; a <p class="kicker"> here would mean
    // a skill group had gone back to div/p markup.
    expect(skills).not.toMatch(/<p class="kicker/);
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
