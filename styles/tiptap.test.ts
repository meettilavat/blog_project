import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public editorial figure layout", () => {
  it("keeps wide figures on one desktop alignment axis across the marginalia breakpoint", () => {
    const css = readFileSync(resolve(process.cwd(), "styles/tiptap.css"), "utf8");

    expect(css).toContain("@media (min-width: 1200px) {");
    expect(css).toContain("calc(100vw - 19rem)");
    expect(css).not.toContain("calc(100vw - 31rem)");
    expect(css).not.toContain("calc(100vw - 39rem)");
    expect(css).not.toContain("calc(100vw - 6rem)");
    expect(css).not.toContain("@media (min-width: 1200px) and (max-width: 1599px)");
    expect(css).not.toContain("margin-left: 50%;");
  });

  it("uses the wider technical-reading type scale in public and editor rendering", () => {
    const css = readFileSync(resolve(process.cwd(), "styles/tiptap.css"), "utf8");

    expect(css).toContain(".tiptap-editorial p,");
    expect(css).toContain(".tiptap-editorial li {");
    expect(css).toContain("font-size: clamp(1.0625rem, 1.03rem + 0.14vw, 1.125rem)");
    expect(css).toContain("line-height: 1.78");
  });
});

describe("plate figure treatment", () => {
  const css = readFileSync(resolve(process.cwd(), "styles/tiptap.css"), "utf8");
  it("shows the figure number on the figure, not only in the caption", () => {
    expect(css).toMatch(/\.tiptap-figure::before[^}]*counter\(journal-figure\)/);
  });
  it("no longer prefixes the caption with the counter", () => {
    expect(css).not.toMatch(/figcaption::before[^}]*counter\(journal-figure\)/);
  });
  it("defines corner registration ticks", () => {
    expect(css).toContain(".tiptap-figure-tick");
  });
});
