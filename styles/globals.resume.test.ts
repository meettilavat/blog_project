import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The stylesheet with comments stripped. Every assertion here is a substring
 * check against selector or declaration text, and this file's comments discuss
 * the very selectors those checks reason about — the print block says in prose
 * that it deliberately omits `[data-resume-section]`, which would satisfy a
 * `toContain` for that selector and defeat the matching `not.toContain`. Reading
 * only the rules keeps each assertion about what the browser sees.
 *
 * Replaced with a space, not "": a comment can sit mid-declaration, and joining
 * the halves would fabricate tokens that were never in the source.
 */
const css = readFileSync(resolve(process.cwd(), "styles/globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  " "
);

describe("styles/globals.css resume ledger", () => {
  it("defines the ledger block at the 52rem measure", () => {
    expect(css).toContain(".resume-ledger");
    expect(css).toContain("width: min(100%, 52rem)");
  });

  it("defines the two-track row grid exactly once", () => {
    expect(css).toContain("grid-template-columns: 7rem minmax(0, 1fr)");
    const occurrences = css.split("grid-template-columns: 7rem minmax(0, 1fr)").length - 1;
    expect(occurrences).toBe(1);
  });

  it("collapses the label track below the ledger breakpoint", () => {
    expect(css).toContain("@media screen and (max-width: 831px)");
    // Screen-only on purpose. Letter (816px) and A4 (794px) both sit below 831px,
    // and in paged media the query resolves against the page box — so an unscoped
    // query would stack every label on paper and print the mobile layout.
    expect(css).not.toContain("@media (max-width: 831px)");
  });

  it("keys the print break rule on rows and headings, not on whole sections", () => {
    const printBlock = css.slice(css.indexOf("@media print"));

    // The selector list of the rule that actually carries `break-inside: avoid`,
    // not merely the print block that contains it somewhere: both halves of this
    // assertion are about which elements the declaration reaches.
    const breakSelectors = /([^{}]*)\{[^}]*break-inside:\s*avoid[^}]*\}/.exec(printBlock)?.[1] ?? "";

    // Positive first, so the absences below cannot pass on an empty match.
    expect(breakSelectors).toContain("[data-resume-row]");
    expect(breakSelectors).toContain(".resume-sheet h1");
    expect(breakSelectors).toContain(".resume-sheet h2");

    // Not the section wrapper. A section holds every row it owns and "Selected
    // work" is taller than a page, so `break-inside: avoid` there only makes the
    // UA push the whole section to a fresh page and then break inside it anyway
    // — a page of trailing whitespace bought for nothing. The per-row guarantee
    // above is the one worth keeping.
    expect(breakSelectors).not.toContain("data-resume-section");
    expect(printBlock).not.toContain("data-resume-section");

    // The hooks this rule replaced are gone from the print block entirely.
    expect(printBlock).not.toContain("data-resume-skill-group");
    expect(printBlock).not.toContain("data-resume-project");
    expect(printBlock).not.toContain(".resume-sheet address");
  });
});
