import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("lucide-react", () => ({
  ArrowUpRight: ({ className }: { className?: string }) => (
    <svg className={className} data-icon="arrow-up-right" />
  )
}));

import { LedgerNote, LedgerRow, LedgerSection } from "./resume-ledger";

describe("components/profile/resume-ledger.tsx", () => {
  it("renders a section heading on the shared row grid with no index number", () => {
    const html = renderToStaticMarkup(
      <LedgerSection title="Experience">
        <p>child</p>
      </LedgerSection>
    );

    expect(html).toContain("resume-row");
    expect(html).toContain('data-resume-section="true"');
    expect(html).toContain("Experience");
    expect(html).toContain("child");
    expect(html).not.toMatch(/>0\d</);
  });

  it("hides the repeated section label from assistive tech and from the stacked layout", () => {
    const html = renderToStaticMarkup(
      <LedgerSection title="Experience">
        <p>child</p>
      </LedgerSection>
    );

    // The title is rendered twice on purpose: once in the mono label track so a
    // row never looks orphaned mid-scroll, once as the heading. That makes the
    // label track purely visual, so only the <h2> should be announced.
    expect(html.match(/Experience/g)).toHaveLength(2);

    const labelTag = /<span[^>]*class="kicker[^>]*>/.exec(html)?.[0] ?? "";
    const headingTag = /<h2[^>]*>/.exec(html)?.[0] ?? "";
    const labelClasses = (/class="([^"]*)"/.exec(labelTag)?.[1] ?? "").split(/\s+/);

    expect(labelTag).toContain('aria-hidden="true"');
    // Moving aria-hidden onto the heading instead would silence the section
    // name entirely, so assert it is absent there rather than only present above.
    expect(headingTag).not.toContain("aria-hidden");

    // Below `ledger` (832px) .resume-row stacks, which would print the kicker
    // directly above its own heading. Asserted as exact class tokens, not
    // substrings of the tag: `toContain("hidden")` on the raw tag would also be
    // satisfied by aria-hidden="true" and would assert nothing.
    expect(labelClasses).toContain("hidden");
    // The responsive half is what keeps the wide-screen anchor alive. Dropping
    // it would leave the kicker hidden at every width, silently deleting the
    // only reason it exists.
    expect(labelClasses).toContain("ledger:block");
  });

  it("puts the period in the label track and the role in the content track", () => {
    const html = renderToStaticMarkup(
      <LedgerRow
        entry={{
          label: "2023",
          labelDetail: "May–Jul",
          title: "Web Development Trainee",
          meta: "Yellow Apple Solutions · Surat, India",
          bullets: ["Converted UI mockups into responsive pages."]
        }}
      />
    );

    expect(html).toContain('data-resume-row="true"');

    // Source order is what assigns a cell to a track: the first grid child lands
    // in the 7rem label track, the second in the content track. Asserting on the
    // label cell's own contents — not just on the page as a whole — is what
    // makes this fail if the two cells are ever swapped.
    const labelCell = /<p class="kicker[^"]*">([\s\S]*?)<\/p>/.exec(html)?.[1] ?? "";
    expect(labelCell).toContain("2023");
    expect(labelCell).toContain("May–Jul");
    expect(labelCell).not.toContain("Web Development Trainee");

    expect(html).toContain("Web Development Trainee");
    expect(html).toContain("Yellow Apple Solutions");
    expect(html).toContain("Converted UI mockups");
    expect(html.indexOf("2023")).toBeLessThan(html.indexOf("Web Development Trainee"));
  });

  it("renders a project link inline rather than in a third column", () => {
    const html = renderToStaticMarkup(
      <LedgerRow
        entry={{
          label: "Production",
          title: "meettilavat.com — this site",
          stack: "Next.js · Supabase",
          link: { href: "https://github.com/meettilavat/blog_project", text: "View source", external: true }
        }}
      />
    );

    expect(html).toContain('href="https://github.com/meettilavat/blog_project"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain("View source");
    expect(html).toContain("Next.js · Supabase");
  });

  it("omits optional fields instead of rendering empty elements", () => {
    const html = renderToStaticMarkup(
      <LedgerRow entry={{ label: "2018–21", title: "Diploma, Computer Engineering" }} />
    );

    expect(html).toContain("Diploma, Computer Engineering");
    expect(html).not.toContain("<ul");
    // Anchored on the tag boundary: a bare "<a" substring also matches the
    // row's own <article> wrapper, so it could never assert anything.
    expect(html).not.toMatch(/<a[\s>]/);
    // No empty stand-ins for the fields this entry does not carry.
    expect(html).not.toContain("text-foreground/70");
  });

  it("omits the bullet list for an empty array, not only for a missing one", () => {
    const html = renderToStaticMarkup(
      <LedgerRow
        entry={{ label: "2018–21", title: "Diploma, Computer Engineering", bullets: [] }}
      />
    );

    // The row itself still renders, so the absences below cannot hold trivially.
    expect(html).toContain("Diploma, Computer Engineering");
    expect(html).not.toContain("<ul");
    // Anchored on the tag boundary: a bare "<li" substring would also match a
    // <link>, so it could go on passing after the element it guards appeared.
    expect(html).not.toMatch(/<li[\s>]/);
  });

  it("renders earlier work as a muted note list without accent rules", () => {
    const html = renderToStaticMarkup(
      <LedgerNote
        label="Earlier"
        items={["Image caption generator — ResNet50 on Flickr8k.", "Personal blog — PHP/MySQL."]}
      />
    );

    expect(html).toContain('data-resume-row="true"');

    // Held to the same standard as LedgerRow above: isolate the label cell so
    // putting the items in the label track — or the label in the content track —
    // fails here. A whole-document toContain would see both either way.
    const labelCell = /<p class="kicker[^"]*">([\s\S]*?)<\/p>/.exec(html)?.[1] ?? "";
    expect(labelCell).toBe("Earlier");

    // Source order is what assigns a cell to a track: label first, list second.
    expect(html.indexOf("Earlier")).toBeLessThan(html.indexOf("Image caption generator"));

    // Every item lands in its own <li> rather than being concatenated into one.
    expect(html.match(/<li[\s>]/g) ?? []).toHaveLength(2);
    expect(html).toContain("Image caption generator");
    expect(html).toContain("Personal blog");

    // "Muted, without accent rules" is the whole point of this variant: the
    // accent rule spans a full LedgerRow's bullets get must not appear.
    expect(html).not.toContain("bg-accent");
  });
});
