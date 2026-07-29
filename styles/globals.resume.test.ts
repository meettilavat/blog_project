import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "styles/globals.css"), "utf8");

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

  it("keys print break rules on the new row hooks, not the deleted ones", () => {
    const printBlock = css.slice(css.indexOf("@media print"));
    expect(printBlock).toContain("[data-resume-section]");
    expect(printBlock).toContain("[data-resume-row]");
    expect(printBlock).not.toContain("data-resume-skill-group");
    expect(printBlock).not.toContain("data-resume-project");
    expect(printBlock).not.toContain(".resume-sheet address");
  });
});
