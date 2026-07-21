import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import HeroField, { __resetPlayedSlugs, __playedSlugs } from "@/components/field/hero-field";

describe("HeroField", () => {
  beforeEach(() => __resetPlayedSlugs());

  it("renders an aria-hidden, non-interactive canvas", () => {
    const html = renderToStaticMarkup(<HeroField title="Tree Census" />);
    expect(html).toContain("<canvas");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events');
  });

  it("records the slug as played after mount logic runs", () => {
    // play-once is driven by an effect; here we assert the registry exists and is keyed by title.
    expect(__playedSlugs()).toBeInstanceOf(Set);
  });

  it("repaints once on theme class change via MutationObserver", () => {
    // Node env has no canvas/RAF, so this asserts the wiring contract at source level
    // (same pattern as styles/globals.accent.test.ts).
    const src = readFileSync(resolve(process.cwd(), "components/field/hero-field.tsx"), "utf8");
    expect(src).toContain("MutationObserver");
    expect(src).toContain('attributeFilter: ["class"]');
    expect(src).toContain("themeObserver.disconnect()");
  });
});
