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

import { FEATURED_POST_SLUG } from "@/lib/posts/featured";

import ResumePage from "./resume-page";

/**
 * Where the case-study link points, built the way `resume-data.ts` builds it. A
 * copy of the slug would turn two tests red on the day a different essay is
 * promoted, with failures that talk about URLs rather than about the featured post
 * having moved.
 */
const FEATURED_POST_HREF = `/posts/${FEATURED_POST_SLUG}`;

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

/**
 * The rows marked print-only, each with its opening tag and its inner markup.
 *
 * The close is found by the next `</div>`, which is only correct while such a row
 * holds no nested <div> — asserted at the call site rather than assumed, so a row
 * that grows a wrapper fails loudly instead of yielding a truncated slice that
 * every absence check would pass against.
 */
function printOnlyRows(html: string): Array<{ tag: string; inner: string }> {
  const rows: Array<{ tag: string; inner: string }> = [];
  for (const match of html.matchAll(/<[a-z][a-z0-9]*\s[^>]*>/gi)) {
    const [tag] = match;
    if (!/\sdata-resume-print-only="true"/.test(tag)) continue;
    // The match's own index, not indexOf(tag): both print rows carry byte-for-byte
    // identical opening tags, so a search by tag text would slice the first row's
    // contents twice and the second row would never be examined at all.
    const start = match.index + tag.length;
    const end = html.indexOf("</div>", start);
    rows.push({ tag, inner: html.slice(start, end === -1 ? html.length : end) });
  }
  return rows;
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

  it("recolours the availability line with an important utility", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    // The opening tag of the element carrying the line, found by its text so the
    // role kicker directly above — same `.kicker` class, no accent — cannot stand in
    // for it.
    const tokens = classTokens(/<p[^>]*>(?=Open to full-time roles)/.exec(html)?.[0] ?? "");

    // Found and parsed, so the token check below is not passing on an empty list.
    expect(tokens).toContain("kicker");

    // `.kicker` declares its own `color` and sits in author CSS after
    // `@tailwind utilities`, so at equal specificity the later rule wins and a plain
    // `text-accent` utility here is inert — the line renders muted grey, silently,
    // and looks deliberate. The `!` is the whole recolouring.
    //
    // An exact token rather than a substring: `text-accent` is a substring of
    // `!text-accent`, so `toContain` against the raw tag text would pass for the
    // broken form too, and this assertion would pin nothing at all.
    expect(tokens).toContain("!text-accent");
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
    expect(html).toContain(`href="${FEATURED_POST_HREF}"`);
  });

  it("keeps the PDF download and drops the retired skill groups", () => {
    const html = renderToStaticMarkup(<ResumePage />);

    expect(html).toContain('href="/resume/meet-tilavat-resume.pdf"');
    expect(html).toContain('download="Meet_Tilavat_Resume.pdf"');
    expect(html).toContain("Download PDF");
    expect(html).not.toContain("VS Code");
    expect(html).not.toContain("Custom PC building");
  });

  it("keeps the whole action cluster off paper, not just the download", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const anchors = anchorTags(html);
    const find = (href: string) => anchors.find((tag) => tag.includes(`href="${href}"`)) ?? "";

    for (const href of [
      "/resume/meet-tilavat-resume.pdf",
      LINKEDIN_PROFILE_URL,
      GITHUB_PROFILE_URL
    ]) {
      const tokens = classTokens(find(href));

      // Found, and its class list parsed. Without this the print check below would
      // pass on an empty list for an anchor that had vanished from the band.
      expect(tokens, href).toContain("inline-flex");

      // An exact class token of *this* anchor. A document-wide
      // toContain("print:hidden") is satisfied by any one element carrying it and
      // would say nothing about the other two; a raw-tag substring check would
      // also be satisfied by a neighbouring attribute value.
      expect(tokens, href).toContain("print:hidden");
    }

    // Exactly the three anchors carry it, plus their wrapper — the wrapper is
    // hidden deliberately, because hiding only the anchors collapses its grid row
    // to 0px while the band's row-gap survives, leaving contentless whitespace on
    // paper. So: three anchors, four elements document-wide. The "View source"
    // project link picking the class up would push the second count to five,
    // which the per-anchor checks above cannot see.
    expect(anchors.filter((tag) => classTokens(tag).includes("print:hidden"))).toHaveLength(3);
    expect(html.split("print:hidden").length - 1).toBe(4);

    // The project link inside "Selected work" is not part of the cluster and still
    // prints, so the counts above are not passing because everything is hidden.
    const caseStudy = classTokens(find(FEATURED_POST_HREF));
    expect(caseStudy).toContain("inline-flex"); // found and parsed, so the next line means something
    expect(caseStudy).not.toContain("print:hidden");
  });

  it("puts the profile URLs on paper as two more contact rows", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    const rows = printOnlyRows(html);

    expect(rows).toHaveLength(2);

    for (const { tag, inner } of rows) {
      // Rides the shared shell rather than a bespoke wrapper: same grid class,
      // same `break-inside: avoid` hook as every other row on the sheet.
      expect(classTokens(tag)).toContain("resume-row");
      expect(tag).toMatch(/\sdata-resume-row="true"/);
      // The slicing in printOnlyRows() assumed no nested <div>; if that stops
      // holding, `inner` is truncated and the checks below stop meaning anything.
      expect(inner).not.toMatch(/<div[\s>]/);
      // Nothing here pretends to be followable — an href on paper is a dead end,
      // and a second anchor per profile would break the exact href counts above.
      expect(inner).not.toMatch(/<a[\s>]/);
      // Hidden by `display: none`, so already out of the accessibility tree on
      // screen. aria-hidden would instead leave them announced but invisible.
      expect(tag).not.toContain("aria-hidden");
    }

    // Read out of the row's own cells and compared whole. A document-wide
    // toContain("github.com/meettilavat") would be satisfied by the source
    // repository URL — GITHUB_PROFILE_URL + "/blog_project" — that "Selected
    // work" links to, so it could pass with these rows deleted entirely.
    expect(
      rows.map(({ inner }) => ({
        label: /<dt[^>]*>([\s\S]*?)<\/dt>/.exec(inner)?.[1] ?? "",
        value: /<dd[^>]*>([\s\S]*?)<\/dd>/.exec(inner)?.[1] ?? ""
      }))
    ).toEqual([
      { label: "LinkedIn", value: "linkedin.com/in/meettilavat" },
      { label: "GitHub", value: "github.com/meettilavat" }
    ]);

    // Once per medium, still: the URL text exists exactly once on the sheet, and
    // only inside a print-only row. Delimited by the tag boundaries either side,
    // so the repository href cannot satisfy the GitHub count.
    for (const url of ["linkedin.com/in/meettilavat", "github.com/meettilavat"]) {
      expect(html.split(`>${url}<`).length - 1, url).toBe(1);
    }

    // ...and on paper these rows are the *only* source of either URL, because the
    // action links that also name those destinations are print-hidden. Both halves
    // are needed: the counts above are about the sheet, this is about the medium.
    for (const href of [LINKEDIN_PROFILE_URL, GITHUB_PROFILE_URL]) {
      const tokens = classTokens(anchorTags(html).find((t) => t.includes(`href="${href}"`)) ?? "");
      expect(tokens, href).toContain("inline-flex");
      expect(tokens, href).toContain("print:hidden");
    }

    // Both land after the three shared rows, so paper reads Base/Email/Phone and
    // then the profiles rather than interleaving them.
    expect(html.indexOf("+91 99133 20031")).toBeLessThan(
      html.indexOf(">linkedin.com/in/meettilavat<")
    );
    // ...and inside the contact <dl>, not appended after it as a third list.
    expect(html.match(/<dl[\s>]/g) ?? []).toHaveLength(2);
  });

  it("leaves the on-screen contact rows carrying only Base, Email, and Phone", () => {
    const html = renderToStaticMarkup(<ResumePage />);
    // Every contact row, print-only or not, in source order: the <dl> runs from
    // the first <dl> to its close, which is the contact list — the skills <dl>
    // sits inside a later section.
    const contactList = html.slice(html.indexOf("<dl"), html.indexOf("</dl>"));

    const labels = [...contactList.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>/g)].map(([, label]) => label);
    // Positive first: five rows, in this order. An empty or mis-aimed slice would
    // otherwise satisfy the screen-only check below for free.
    expect(labels).toEqual(["Base", "Email", "Phone", "LinkedIn", "GitHub"]);

    const paperRows = printOnlyRows(contactList);
    expect(paperRows).toHaveLength(2);

    // The three rows that render in both media carry no URL text at all — the
    // duplication the ledger rebuild removed does not come back on screen. Sliced
    // at the first print-only row, so the URLs below it are out of the window.
    const sharedRows = contactList.slice(0, contactList.indexOf(paperRows[0]?.tag ?? "</dl>"));
    expect(sharedRows).toContain("Gujarat, India");
    expect(sharedRows).not.toContain("linkedin.com");
    expect(sharedRows).not.toContain("github.com");
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
