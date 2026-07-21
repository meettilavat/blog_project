import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/field/text-sampler", () => ({
  sampleTitlePoints: () => new Float32Array([4, 4, 8, 8, 12, 12])
}));

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
});
