import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "styles/globals.css"), "utf8");
const publicLight = css.slice(
  css.indexOf('html[data-app="public"] {'),
  css.indexOf('html[data-app="public"].dark')
);
const publicDark = css.slice(
  css.indexOf('html[data-app="public"].dark'),
  css.indexOf('html[data-app="admin"]')
);

describe("public signal-amber tokens", () => {
  it("uses signal amber for the light accent", () => {
    expect(publicLight).toContain("--accent: #9A5B00;");
    expect(publicLight).toContain("--accent-rgb: 154 91 0;");
  });

  it("uses signal amber for the dark accent", () => {
    expect(publicDark).toContain("--accent: #F2A93B;");
    expect(publicDark).toContain("--accent-rgb: 242 169 59;");
  });

  it("sets the new ground/ink on both themes", () => {
    expect(publicLight).toContain("--background: #F7F7F5;");
    expect(publicLight).toContain("--foreground: #16181D;");
    expect(publicDark).toContain("--background: #0B0D10;");
    expect(publicDark).toContain("--foreground: #E8EAEE;");
  });

  it("removes the journal-only tokens", () => {
    expect(publicLight).not.toContain("--paper");
    expect(publicLight).not.toContain("--rule-strong");
    expect(publicDark).not.toContain("--paper");
    expect(publicDark).not.toContain("--rule-strong");
  });

  it("keeps ink-2 as the sole muted-ink token", () => {
    expect(publicLight).toContain("--ink-muted: #5B6270;");
    expect(publicDark).toContain("--ink-muted: #9BA3AF;");
  });
});

describe("public reading font", () => {
  it("sets Newsreader as the public body font", () => {
    expect(css).toContain('html[data-app="public"] body {');
    expect(css).toMatch(/html\[data-app="public"\] body \{[^}]*font-family:\s*var\(--font-body\)/);
  });
});
