import { describe, expect, it } from "vitest";

import {
  COMBINED_PULL_CAP_PX,
  DAMPING,
  LENS_ALPHA_CAP,
  LENS_PULL_CAP_PX,
  LENS_RADIUS_PX,
  PARALLAX_MAX_PX,
  SETTLE_EPSILON_PX,
  TRANSIT_AXIS_RADIANS,
  TRANSIT_BAND_FRACTION,
  TRANSIT_DRIFT_PX,
  TRANSIT_FIRST_DELAY_MS,
  TRANSIT_MAX_GAP_MS,
  TRANSIT_MIN_GAP_MS,
  TRANSIT_MS,
  fieldIsSettled,
  lensInfluence,
  parallaxOffset,
  particleDepth,
  stepToward,
  transitInfluence
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

  it("treats a degenerate radius as no lens at all", () => {
    // No production caller passes a radius — hero-field.tsx uses the default —
    // but the parameter is public and the smoothstep behind it divides by
    // (radius - 0). The two degenerate modes fail differently, so both are
    // pinned separately. Each assertion is an equality against a finite number,
    // so a NaN fails rather than slipping through a comparison.

    // Radius 0 with the cursor exactly on the particle is the literal 0/0.
    const centred = lensInfluence(0, 0, 0, 0, 0.4, 0);
    expect(centred.pullX).toBe(0);
    expect(centred.pullY).toBe(0);
    expect(centred.alpha).toBe(0.4);

    // A negative radius does not produce NaN — it inverts the lens, which is
    // harder to notice: the weight reads as full at every distance, so every
    // particle takes the maximum pull and a brightness gain.
    const inverted = lensInfluence(0, 0, 30, 40, 0.4, -LENS_RADIUS_PX);
    expect(inverted.pullX).toBe(0);
    expect(inverted.pullY).toBe(0);
    expect(inverted.alpha).toBe(0.4);

    // Radius 0 at a distance already behaved, because the quotient is +Infinity
    // and clamps to 1. Kept so the guard cannot regress it.
    const offCentre = lensInfluence(0, 0, 30, 40, 0.4, 0);
    expect(offCentre.pullX).toBe(0);
    expect(offCentre.pullY).toBe(0);
    expect(offCentre.alpha).toBe(0.4);
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

  it("treats a delta exactly at epsilon as still moving", () => {
    // The boundary itself, not just either side of it: without this, swapping
    // the comparison for <= keeps every other case in this suite passing.
    expect(fieldIsSettled(SETTLE_EPSILON_PX)).toBe(false);
  });
});

describe("transitInfluence", () => {
  // A horizontal axis with spanLo 0 and span 100 makes the arithmetic legible:
  // band = 9, and the front travels from -9 to 109 across progress 0 -> 1.
  const AXIS_X = 1;
  const AXIS_Y = 0;
  const SPAN_LO = 0;
  const SPAN = 100;

  const at = (baseX: number, progress: number) =>
    transitInfluence(baseX, 0, AXIS_X, AXIS_Y, SPAN_LO, SPAN, progress);

  it("touches nothing at either end of the sweep", () => {
    // The front starts one full band before the field and ends one past it, so
    // the first and last frames of a transit are guaranteed to be no-ops.
    expect(at(0, 0)).toBeNull();
    expect(at(SPAN, 1)).toBeNull();
  });

  it("reaches full weight when the front is exactly on a particle", () => {
    // front = -9 + 118 * 0.5 = 50, which is where this particle sits.
    const result = at(50, 0.5);
    expect(result).not.toBeNull();
    expect(result!.weight).toBeCloseTo(1, 10);
  });

  it("returns the axis vector as the push direction", () => {
    // (30, -40) is 50 units along the unit axis (0.6, -0.8), so it projects onto
    // the front at progress 0.5 exactly as baseX 50 does on the horizontal axis.
    // Passing (50, 0) here instead would project to 30 — 20px off a 9px band —
    // and get the correct null, testing nothing about the returned direction.
    const result = transitInfluence(30, -40, 0.6, -0.8, SPAN_LO, SPAN, 0.5);
    expect(result).not.toBeNull();
    expect(result!.ux).toBe(0.6);
    expect(result!.uy).toBe(-0.8);
  });

  it("falls off smoothly behind and ahead of the front", () => {
    // Progress 0.5 puts the front exactly on the particle at 50. Lower progress
    // leaves the front behind it, higher progress carries the front past it, so
    // both sides of the band need sampling — with only the 0.45/0.48 pair, a
    // distance that is doubled on one side of the front goes undetected and the
    // wavefront is visibly lopsided.
    const onFront = at(50, 0.5)!.weight;
    const nearBehind = at(50, 0.48)!.weight;
    const farBehind = at(50, 0.45)!.weight;
    const nearAhead = at(50, 0.52)!.weight;
    const farAhead = at(50, 0.55)!.weight;
    expect(onFront).toBeGreaterThan(nearBehind);
    expect(nearBehind).toBeGreaterThan(farBehind);
    expect(onFront).toBeGreaterThan(nearAhead);
    expect(nearAhead).toBeGreaterThan(farAhead);
    // The symmetry Math.abs is there to provide: the front is 2.36 from the
    // particle at both 0.48 and 0.52, so the two weights must agree.
    expect(nearAhead).toBeCloseTo(nearBehind, 12);
  });

  it("returns null rather than a zero-weight object outside the band", () => {
    // The frame loop skips ~72% of particles at peak on this null, so it must be
    // a null and not a { weight: 0 } that still costs an allocation.
    expect(at(50, 0.1)).toBeNull();
    expect(at(50, 0.9)).toBeNull();
  });

  it("projects onto the axis rather than using raw coordinates", () => {
    // On a vertical axis the same baseX is irrelevant and baseY decides.
    const vertical = transitInfluence(999, 50, 0, 1, SPAN_LO, SPAN, 0.5);
    expect(vertical).not.toBeNull();
    expect(vertical!.weight).toBeCloseTo(1, 10);
  });

  it("scales the band with the span so the profile is viewport-invariant", () => {
    // This is the property that makes the event look the same shape on a laptop
    // and an ultrawide: band is a fraction of the field's own extent, so a
    // particle at the same relative position sees the same weight at the same
    // progress regardless of absolute size. A fixed-pixel band breaks this.
    for (const progress of [0.42, 0.45, 0.5, 0.55, 0.58]) {
      const small = transitInfluence(50, 0, 1, 0, 0, 100, progress);
      const large = transitInfluence(500, 0, 1, 0, 0, 1000, progress);
      if (small === null) {
        expect(large).toBeNull();
      } else {
        expect(large).not.toBeNull();
        expect(large!.weight).toBeCloseTo(small.weight, 10);
      }
    }
  });

  it("is offset-invariant along the axis", () => {
    // Shifting the whole field along the axis shifts spanLo with it, so the same
    // relative particle sees the same weight.
    const atOrigin = transitInfluence(50, 0, 1, 0, 0, 100, 0.47);
    const shifted = transitInfluence(1050, 0, 1, 0, 1000, 100, 0.47);
    expect(shifted!.weight).toBeCloseTo(atOrigin!.weight, 10);
  });

  it("pins the band's half-width to 9% of the span", () => {
    // TRANSIT_BAND_FRACTION was chosen from a live demo, so a different value is
    // a defect rather than a preference — and every other assertion in this file
    // survives changing it, because they either use span 100 (where they hold for
    // any band up to 200) or compare two spans (which is fraction-independent).
    // These literals are the pin: band = 100 * 0.09 = 9 and the front sits at 50
    // at progress 0.5, so the band's far edge lands exactly on 59 — zero weight
    // there, non-zero a hundredth inside it. Raise the fraction and 59 engages.
    expect(SPAN * TRANSIT_BAND_FRACTION).toBeCloseTo(9, 10);
    expect(at(59, 0.5)).toBeNull();
    expect(at(58.99, 0.5)).not.toBeNull();
  });

  it("treats a degenerate span as no transit at all", () => {
    // A one-particle field has no axis to sweep. This documents that intent; it
    // does not detect the guard's removal, and cannot: with the guard gone, band
    // comes out 0 or negative, smoothstep's own `edge1 <= edge0` guard returns 1,
    // and the `weight <= 0` path returns an identical null. The guard exists so
    // the behaviour is stated in transitInfluence instead of being inherited from
    // another function's internals — a distinction no fixture can observe from
    // out here, so there is no honest way to give this test teeth.
    expect(transitInfluence(50, 0, 1, 0, 0, 0, 0.5)).toBeNull();
    expect(transitInfluence(50, 0, 1, 0, 0, -100, 0.5)).toBeNull();
  });

  it("treats a degenerate band fraction as no transit at all", () => {
    // Same standing as the degenerate-span test above: a zero or negative
    // fraction yields a zero or negative band, which smoothstep already answers
    // with 1 and so weight 0, so this documents intent rather than detecting the
    // guard's removal. The guard is there to keep that answer local to this
    // function rather than dependent on smoothstep's internals.
    expect(transitInfluence(50, 0, 1, 0, 0, 100, 0.5, 0)).toBeNull();
    expect(transitInfluence(50, 0, 1, 0, 0, 100, 0.5, -0.09)).toBeNull();
  });

  it("refuses a progress outside the sweep", () => {
    // -1 is the caller's no-transit sentinel. These three are documentation, not
    // coverage: the front launches a full band before the field, so for a
    // particle inside [0, 100] an out-of-range progress returns null from the
    // band test whether the guard is there or not.
    expect(at(50, -1)).toBeNull();
    expect(at(50, -0.01)).toBeNull();
    expect(at(50, 1.01)).toBeNull();

    // This one has teeth. baseX -5 is deliberately outside the field's own
    // extent, which is the only way to make the guard observable: at progress
    // -0.02 the front is at -9 + 118 * -0.02 = -11.36, only 6.36 from -5 and so
    // inside the 9px band. Without the guard this returns a real weight.
    expect(transitInfluence(-5, 0, AXIS_X, AXIS_Y, SPAN_LO, SPAN, -0.02)).toBeNull();

    // So does NaN, which is why the guard is a negated total range rather than
    // two comparisons: `NaN < 0` and `NaN > 1` are both false, so the pair let it
    // through and handed back { weight: NaN } — a NaN that reaches a canvas
    // coordinate makes those dots stop drawing with nothing logged to trace it.
    expect(at(50, Number.NaN)).toBeNull();
  });

  it("sizes the drift so that a combined cap is necessary", () => {
    // Nothing in this module caps anything — COMBINED_PULL_CAP_PX is enforced in
    // the frame loop. What is checkable here is that the constants make the
    // combined cap load-bearing rather than decorative: a lens pull already at
    // its own 6px cap plus a full-weight transit drift of 5.5px sums to 11.5px,
    // past the 8px combined cap, so capping each influence separately would let a
    // cursor parked on a passing front shift a dot further than either allows.
    expect(LENS_PULL_CAP_PX + TRANSIT_DRIFT_PX).toBeGreaterThan(COMBINED_PULL_CAP_PX);
  });
});

describe("transit constants", () => {
  it("points the sweep up and to the right, matching the field's mass bias", () => {
    // buildFieldTargets biases density toward the upper right, so a transit that
    // travels along that diagonal stays in the dense region longest.
    expect(Math.cos(TRANSIT_AXIS_RADIANS)).toBeGreaterThan(0); // rightward
    expect(Math.sin(TRANSIT_AXIS_RADIANS)).toBeLessThan(0);    // upward (canvas y grows down)
  });

  it("keeps the cadence window ordered and rare", () => {
    expect(TRANSIT_MIN_GAP_MS).toBeLessThan(TRANSIT_MAX_GAP_MS);
    // The first transit lands well inside a short visit; later ones are rare
    // enough that a lingering visitor reads them as occasional, not cyclic.
    expect(TRANSIT_FIRST_DELAY_MS).toBeLessThan(TRANSIT_MIN_GAP_MS);
    expect(TRANSIT_MS).toBeLessThan(TRANSIT_FIRST_DELAY_MS);
  });
});
