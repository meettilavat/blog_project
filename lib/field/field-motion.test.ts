import { describe, expect, it } from "vitest";

import {
  DAMPING,
  LENS_ALPHA_CAP,
  LENS_PULL_CAP_PX,
  LENS_RADIUS_PX,
  PARALLAX_MAX_PX,
  SETTLE_EPSILON_PX,
  fieldIsSettled,
  lensInfluence,
  parallaxOffset,
  particleDepth,
  stepToward
} from "./field-motion";

describe("particleDepth", () => {
  it("maps the alpha range onto 0..1 so brighter dots read as nearer", () => {
    expect(particleDepth(0.16, 0.16, 0.66)).toBe(0);
    expect(particleDepth(0.66, 0.16, 0.66)).toBe(1);
    expect(particleDepth(0.41, 0.16, 0.66)).toBeCloseTo(0.5, 5);
  });

  it("clamps out-of-range alphas", () => {
    expect(particleDepth(0.1, 0.16, 0.66)).toBe(0);
    expect(particleDepth(0.9, 0.16, 0.66)).toBe(1);
  });

  it("treats a degenerate range as full depth", () => {
    expect(particleDepth(0.4, 0.4, 0.4)).toBe(1);
  });
});

describe("parallaxOffset", () => {
  it("is zero at the centre of the hero", () => {
    expect(parallaxOffset(0.5, 1)).toBe(0);
  });

  it("shifts against the pointer so the field reads as depth", () => {
    // Pointer right of centre pushes near particles left.
    expect(parallaxOffset(1, 1)).toBeCloseTo(-PARALLAX_MAX_PX, 5);
    expect(parallaxOffset(0, 1)).toBeCloseTo(PARALLAX_MAX_PX, 5);
  });

  it("scales by depth so far particles barely move", () => {
    expect(parallaxOffset(1, 0)).toBe(0);
    expect(Math.abs(parallaxOffset(1, 0.25))).toBeLessThan(Math.abs(parallaxOffset(1, 1)));
  });

  it("never exceeds the configured maximum", () => {
    for (const norm of [0, 0.25, 0.5, 0.75, 1]) {
      expect(Math.abs(parallaxOffset(norm, 1))).toBeLessThanOrEqual(PARALLAX_MAX_PX + 1e-9);
    }
  });
});

describe("lensInfluence", () => {
  it("leaves particles outside the radius untouched", () => {
    const result = lensInfluence(0, 0, LENS_RADIUS_PX + 10, 0, 0.4);
    expect(result.pullX).toBe(0);
    expect(result.pullY).toBe(0);
    expect(result.alpha).toBe(0.4);
  });

  it("pulls toward the cursor, not away from it", () => {
    // Cursor is to the right, so the pull must be positive.
    const result = lensInfluence(0, 0, 40, 0, 0.4);
    expect(result.pullX).toBeGreaterThan(0);
  });

  it("caps displacement so a lingering cursor cannot clump the field", () => {
    const result = lensInfluence(0, 0, LENS_RADIUS_PX * 0.05, 0, 0.4);
    expect(Math.abs(result.pullX)).toBeLessThanOrEqual(LENS_PULL_CAP_PX);
    expect(Math.abs(result.pullY)).toBeLessThanOrEqual(LENS_PULL_CAP_PX);
  });

  it("engages the cap on both axes and both signs when geometry exceeds it", () => {
    // The pull term peaks near d = 0.42 * radius; at the default radius that
    // peak is ~6.08px, so the cap clips it. Without a clamp this returns 6.08.
    expect(lensInfluence(0, 0, 54.8, 0, 0.4).pullX).toBe(LENS_PULL_CAP_PX);
    // A widened lens clears the cap on both axes by a wide margin (~8.68px each).
    const wide = lensInfluence(0, 0, 120, 120, 0.4, 300);
    expect(wide.pullX).toBe(LENS_PULL_CAP_PX);
    expect(wide.pullY).toBe(LENS_PULL_CAP_PX);
    // Clamping is symmetric, so a cursor up-left is bounded the same way.
    const negative = lensInfluence(0, 0, -120, -120, 0.4, 300);
    expect(negative.pullX).toBe(-LENS_PULL_CAP_PX);
    expect(negative.pullY).toBe(-LENS_PULL_CAP_PX);
  });

  it("brightens inside the radius but never past the cap", () => {
    const near = lensInfluence(0, 0, 5, 0, 0.4);
    expect(near.alpha).toBeGreaterThan(0.4);
    const bright = lensInfluence(0, 0, 0, 0, 0.84);
    expect(bright.alpha).toBeLessThanOrEqual(LENS_ALPHA_CAP);
  });

  it("falls off smoothly with distance", () => {
    const close = lensInfluence(0, 0, 20, 0, 0.4).alpha;
    const mid = lensInfluence(0, 0, 70, 0, 0.4).alpha;
    const far = lensInfluence(0, 0, 120, 0, 0.4).alpha;
    expect(close).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
  });
});

describe("stepToward", () => {
  it("moves a fraction of the remaining distance", () => {
    expect(stepToward(0, 100)).toBeCloseTo(100 * DAMPING, 5);
  });

  it("converges without overshooting", () => {
    let value = 0;
    for (let i = 0; i < 200; i++) value = stepToward(value, 10);
    expect(value).toBeCloseTo(10, 3);
    expect(value).toBeLessThanOrEqual(10);
  });
});

describe("fieldIsSettled", () => {
  it("reports settled only once movement is imperceptible", () => {
    expect(fieldIsSettled(SETTLE_EPSILON_PX / 2)).toBe(true);
    expect(fieldIsSettled(SETTLE_EPSILON_PX * 2)).toBe(false);
  });
});
