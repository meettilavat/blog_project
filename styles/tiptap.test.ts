import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public editorial figure layout", () => {
  it("centres wide figures on the page axis, up to the media band", () => {
    const css = readFileSync(resolve(process.cwd(), "styles/tiptap.css"), "utf8");

    // Wide figures break out symmetrically from the reading column, centred on
    // the page axis (no sidebar rail to avoid), up to the media width.
    expect(css).toContain("@media (min-width: 1200px) {");
    expect(css).toContain("margin-left: calc((100% - var(--figure-width)) / 2)");
    // Not the old edge-aligned breakout, and never a broken 50% offset.
    expect(css).not.toContain("margin-left: calc(100% - var(--figure-width))");
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

// `--font-serif` is Fraunces, declared only by apps/admin/app/layout.tsx. The public
// app deliberately omits it — apps/public/app/__tests__/layout.test.tsx asserts the
// rendered <html> class list does not contain it. Every rule that reads it is shared
// by both apps, so each needs an inner fallback.
//
// Not for the reason it looks like: an undefined custom property does not fall through
// to the next family in the stack, it voids the whole declaration. Measured on the
// live site before the fix — a blockquote injected into a real post computed to
// `Newsreader, "Newsreader Fallback", …`, the inherited body value, never Georgia. So
// the rules already looked right; they just depended on being invalid to get there.
describe("shared serif rules name a fallback for the public app", () => {
  const css = readFileSync(resolve(process.cwd(), "styles/tiptap.css"), "utf8");
  const globals = readFileSync(resolve(process.cwd(), "styles/globals.css"), "utf8");

  it("falls back to the body serif wherever --font-serif is read", () => {
    const bare = /font-family:\s*var\(--font-serif\)/;
    expect(css).not.toMatch(bare);
    expect(globals).not.toMatch(bare);
    // Two in tiptap.css (headings, blockquote), one in globals.css (typestyle toggle).
    expect(css.match(/var\(--font-serif,\s*var\(--font-body\)\)/g)).toHaveLength(2);
    expect(globals.match(/var\(--font-serif,\s*var\(--font-body\)\)/g)).toHaveLength(1);
  });
});

describe("long-form type system + optical craft (spec §7), public-scoped", () => {
  const css = readFileSync(resolve(process.cwd(), "styles/tiptap.css"), "utf8");

  it("scopes the body measure to the public reading surface only", () => {
    expect(css).toContain(".tiptap-editorial:not(.tiptap-editor-surface) p { max-width: 68ch;");
    expect(css).not.toContain(".tiptap-editorial p { max-width: 68ch");
  });

  it("scopes hanging punctuation to the public reading surface only", () => {
    expect(css).toContain(".tiptap-editorial:not(.tiptap-editor-surface) { hanging-punctuation: first last;");
    expect(css).not.toContain(".tiptap-editorial { hanging-punctuation");
  });

  it("balances headings and pretties body wrapping", () => {
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("text-wrap: pretty");
  });

  it("hyphenates body copy with a conservative limit", () => {
    expect(css).toContain("hyphens: auto");
    expect(css).toContain("hyphenate-limit-chars: 6 3 3");
  });

  it("moves headings to the display face on the public surface only", () => {
    expect(css).toContain(
      ".tiptap-editorial:not(.tiptap-editor-surface) h1, .tiptap-editorial:not(.tiptap-editor-surface) h2, .tiptap-editorial:not(.tiptap-editor-surface) h3 { font-family: var(--font-display), sans-serif; }"
    );
  });

  it("renders public editorial table headers at 0.75rem", () => {
    expect(css).toContain(".tiptap-editorial:not(.tiptap-editor-surface) table thead th {");
    expect(css).toContain("font-size: 0.75rem");
    expect(css).not.toContain(".tiptap-editorial table thead th {");
  });
});

describe("size-adjust fallback metrics", () => {
  const globals = readFileSync(resolve(process.cwd(), "styles/globals.css"), "utf8");

  it("declares a metric-matched Newsreader fallback face", () => {
    expect(globals).toContain("size-adjust");
    expect(globals).toContain('"Newsreader-fallback"');
  });

  it("wires the fallback into the public body font stack", () => {
    expect(globals).toContain('var(--font-body), "Newsreader-fallback", Georgia, serif');
  });
});
