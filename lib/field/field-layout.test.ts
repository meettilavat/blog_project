import { describe, expect, it } from "vitest";

import { buildFieldTargets, hashString, makeSeededRandom } from "./field-layout";

describe("makeSeededRandom", () => {
  it("returns the same sequence for the same seed", () => {
    const a = makeSeededRandom(1234);
    const b = makeSeededRandom(1234);
    const first = Array.from({ length: 8 }, a);
    const second = Array.from({ length: 8 }, b);
    expect(first).toEqual(second);
  });

  it("returns a different sequence for a different seed", () => {
    const a = Array.from({ length: 8 }, makeSeededRandom(1234));
    const b = Array.from({ length: 8 }, makeSeededRandom(1235));
    expect(a).not.toEqual(b);
  });

  it("stays inside [0, 1)", () => {
    const rand = makeSeededRandom(0xdecafbad);
    for (let i = 0; i < 500; i++) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("hashString", () => {
  it("is stable for the same input", () => {
    expect(hashString("Tree Census")).toBe(hashString("Tree Census"));
  });

  it("separates inputs that differ by one character", () => {
    expect(hashString("Tree Census")).not.toBe(hashString("Tree Censux"));
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const title of ["", "a", "Building Tree Census", "🌳"]) {
      const h = hashString(title);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("buildFieldTargets", () => {
  const seed = hashString("layout");

  it("is deterministic for the same size and seed", () => {
    expect(buildFieldTargets(1200, 600, seed)).toEqual(buildFieldTargets(1200, 600, seed));
  });

  it("lays out a different field for a different seed", () => {
    const a = buildFieldTargets(1200, 600, seed);
    const b = buildFieldTargets(1200, 600, hashString("layout other"));
    expect(a).not.toEqual(b);
  });

  it("yields no targets at all when either dimension collapses", () => {
    // The premise `startField`'s zero-size bail rests on: `step` floors at 12, so a
    // dimension of 1 fails the loop's first comparison and nothing is produced.
    // If this ever returned targets, that bail would stop firing and the field
    // would animate a 1x1 canvas.
    expect(buildFieldTargets(1, 1, seed)).toHaveLength(0);
    expect(buildFieldTargets(1200, 1, seed)).toHaveLength(0);
    expect(buildFieldTargets(1, 600, seed)).toHaveLength(0);
  });

  it("thickens from left to right", () => {
    // The gradient is the whole design: a scattering at the left building to full
    // strength at the right. Counting per fifth catches an inverted or flattened
    // mask, which a total-count assertion would not.
    const targets = buildFieldTargets(1600, 700, seed);
    const fifths = [0, 0, 0, 0, 0];
    for (const t of targets) fifths[Math.min(4, Math.floor((t.x / 1600) * 5))]++;
    for (let i = 1; i < fifths.length; i++) {
      expect(fifths[i]).toBeGreaterThanOrEqual(fifths[i - 1]);
    }
    expect(fifths[4]).toBeGreaterThan(fifths[0]);
  });

  it("leaves the left edge clear for the headline", () => {
    const targets = buildFieldTargets(1600, 700, seed);
    expect(targets.some((t) => t.x < 1600 * 0.15)).toBe(false);
    expect(targets.length).toBeGreaterThan(100);
  });

  it("keeps every dot inside the canvas", () => {
    // Jitter is applied after the lattice position, so the clamps are what stop a
    // dot landing outside the bitmap and being silently dropped by the rasteriser.
    const targets = buildFieldTargets(320, 240, seed);
    for (const t of targets) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThanOrEqual(319);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeLessThanOrEqual(239);
    }
  });

  it("keeps alpha inside the range the depth and ceiling maths assume", () => {
    // `particleDepth` normalises against these bounds and `composeAlpha` ceilings at
    // 0.85, so an alpha above 0.66 here would make the ceiling bind on an untouched
    // dot and break the "unlensed particle paints at exactly its base alpha" pin.
    const targets = buildFieldTargets(1600, 700, seed);
    for (const t of targets) {
      expect(t.a).toBeGreaterThan(0.16);
      expect(t.a).toBeLessThanOrEqual(0.66);
    }
  });
});
