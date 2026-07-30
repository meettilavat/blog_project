/**
 * Per-frame motion arithmetic for the hero particle field: parallax, the cursor
 * lens, damping, the settle test, and the transit wavefront. Kept free of DOM and
 * canvas references so it is unit-testable under Vitest's `node` environment.
 *
 * Not *all* of the field's pure arithmetic, though. hero-field.tsx still owns its
 * own seeding and layout helpers — `makeSeededRandom`, `hashString`,
 * `buildFieldTargets`, and a local `smoothstep` — which are equally pure and
 * would belong here; moving them is deferred to separate follow-up work. What
 * lives here is the arithmetic the frame loop runs, and hero-field.tsx keeps the
 * canvas, the listeners, the observers, and the frame scheduling.
 */

/** Largest parallax displacement, in CSS px, applied to the nearest layer. */
export const PARALLAX_MAX_PX = 12;

/** Radius of the cursor's lens, in CSS px. */
export const LENS_RADIUS_PX = 130;

/** Fraction of the cursor-to-particle vector applied as attraction. */
export const LENS_PULL = 0.18;

/** Hard cap on lens displacement so a lingering cursor cannot clump the field. */
export const LENS_PULL_CAP_PX = 6;

/** Peak proportional alpha gain at the centre of the lens. */
export const LENS_ALPHA_GAIN = 0.55;

/** Ceiling on lensed alpha, so the field never competes with the headline. */
export const LENS_ALPHA_CAP = 0.85;

/** Per-frame approach fraction. Low enough that the field trails the cursor. */
export const DAMPING = 0.14;

/** Below this per-frame delta the field counts as settled and the loop halts. */
export const SETTLE_EPSILON_PX = 0.05;

/**
 * Half-width of the transit's band, as a fraction of the field's extent along
 * the travel axis — not a pixel count. A proportional band makes the sweep
 * profile viewport-invariant: measured peak engagement is 28% at 700x250 and 29%
 * at 1440x560, with matching curves. A fixed pixel band would be a thin blade on
 * an ultrawide and a flood on a laptop.
 */
export const TRANSIT_BAND_FRACTION = 0.09;

/** How long one transit takes to cross the field, in ms. ~90 frames at 60fps. */
export const TRANSIT_MS = 1500;

/** Peak displacement a transit applies, along its direction of travel, in CSS px. */
export const TRANSIT_DRIFT_PX = 5.5;

/** Peak proportional alpha gain at the centre of the transit's band. */
export const TRANSIT_ALPHA_GAIN = 0.95;

/**
 * Cap on the *sum* of every displacement acting on a particle. Capping each
 * influence separately would let a cursor parked where a transit crosses shift a
 * dot by LENS_PULL_CAP_PX + TRANSIT_DRIFT_PX = 11.5px, further than either is
 * allowed alone.
 */
export const COMBINED_PULL_CAP_PX = 8;

/** Delay from the field settling to its first transit, in ms. */
export const TRANSIT_FIRST_DELAY_MS = 4000;

/** Shortest gap between transits, in ms. */
export const TRANSIT_MIN_GAP_MS = 40_000;

/** Longest gap between transits, in ms. */
export const TRANSIT_MAX_GAP_MS = 70_000;

/**
 * Direction of travel, in radians. Roughly (+0.588, -0.809) — right and up,
 * echoing the upper-right mass bias buildFieldTargets already applies.
 */
export const TRANSIT_AXIS_RADIANS = -0.30 * Math.PI;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Bounds `value` to ±`cap`, preserving sign.
 *
 * `cap` must be non-negative. A negative one collapses this to the constant
 * `cap` for every input — a sign-flipped constant, silently — but both call
 * sites pass a positive module constant, so this is a note for the next caller
 * rather than a case worth guarding at runtime.
 */
export function clampMagnitude(value: number, cap: number): number {
  return Math.min(cap, Math.max(-cap, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  // A zero-width or inverted band has no gradient to interpolate across. Guard
  // it: unguarded, the two degenerate cases fail differently and both silently.
  //
  //   edge1 === edge0 and x === edge0 divides 0 by 0, and the NaN flows on into
  //   pullX/pullY/alpha. Canvas ignores NaN coordinates, so the field would just
  //   stop drawing, with nothing logged to trace it by.
  //
  //   edge1 < edge0 is worse, because it looks like it works: the quotient goes
  //   negative, clamps to 0, and lensInfluence's 1 - smoothstep then reads as
  //   full weight at every distance — the whole field dragged to the cursor.
  //
  // Fully past the band is the right answer for both, and 1 covers the whole
  // reachable domain: both call sites pass edge0 = 0 and an already-non-negative
  // magnitude for x — Math.hypot() for the lens, Math.abs() for the transit — so
  // x >= edge0 always. Returning `x < edge0 ? 0 : 1` instead would read as
  // more general while adding a branch no caller can reach and no test can
  // distinguish — a future caller with a non-zero edge0 should revisit this line
  // rather than inherit dead generality.
  if (edge1 <= edge0) return 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Depth from alpha: the field's brighter dots read as nearer, so they take more
 * parallax. Reuses data buildFieldTargets already produced — no extra arrays.
 */
export function particleDepth(alpha: number, minAlpha: number, maxAlpha: number): number {
  if (maxAlpha <= minAlpha) return 1;
  return clamp01((alpha - minAlpha) / (maxAlpha - minAlpha));
}

/**
 * Displacement along one axis. `pointerNorm` is the pointer's position across
 * the hero, 0..1. Negative by construction: the field shifts *against* the
 * cursor, which is what reads as depth rather than as dragging.
 */
export function parallaxOffset(pointerNorm: number, depth: number, max = PARALLAX_MAX_PX): number {
  const offset = -(pointerNorm - 0.5) * 2 * max * depth;
  // The leading negation makes dead centre — and depth 0 — evaluate to -0.
  // Normalise it: "no displacement" should be one value, so callers comparing
  // frames with Object.is/=== semantics never see a phantom change.
  return offset === 0 ? 0 : offset;
}

export type LensInfluence = {
  pullX: number;
  pullY: number;
  /**
   * Falloff 0..1, not a finished alpha. The caller sums this with every other
   * influence's weight and hands the total to `composeAlpha`, because two
   * influences each returning an already-ceilinged alpha cannot be merged.
   */
  weight: number;
};

/**
 * The cursor gathers and brightens nearby particles. Attraction rather than
 * repulsion: the field's established gesture is condensation, and pulling
 * extends that idea.
 */
export function lensInfluence(
  baseX: number,
  baseY: number,
  pointerX: number,
  pointerY: number,
  radius = LENS_RADIUS_PX
): LensInfluence {
  const dx = pointerX - baseX;
  const dy = pointerY - baseY;
  const weight = 1 - smoothstep(0, radius, Math.hypot(dx, dy));
  if (weight <= 0) {
    return { pullX: 0, pullY: 0, weight: 0 };
  }
  return {
    pullX: clampMagnitude(dx * weight * LENS_PULL, LENS_PULL_CAP_PX),
    pullY: clampMagnitude(dy * weight * LENS_PULL, LENS_PULL_CAP_PX),
    weight
  };
}

/**
 * The single owner of the alpha ceiling, for every influence at once.
 *
 * Lives here rather than inside each influence so that two of them acting on one
 * particle produce one capped result instead of two capped results with no
 * defined way to combine them.
 */
export function composeAlpha(baseAlpha: number, totalGain: number): number {
  return Math.min(LENS_ALPHA_CAP, baseAlpha * (1 + totalGain));
}

export function stepToward(current: number, target: number, damping = DAMPING): number {
  return current + (target - current) * damping;
}

export function fieldIsSettled(maxDelta: number, epsilon = SETTLE_EPSILON_PX): boolean {
  return maxDelta < epsilon;
}

/**
 * Whether a field left this far from base still has work to do — the question a
 * visibility or intersection gate has to answer before deciding to resume.
 *
 * The threshold is not a taste value: a particle `d` from its target moves
 * `d * damping` on the next step, so another frame is worth running exactly when
 * `d * damping` would clear the settle epsilon. Anything at or below that is a
 * field `fieldIsSettled` has already stopped, and waking it would spend a frame
 * to rediscover that and repaint an identical image.
 *
 * This exists so callers can *derive* "something is outstanding" from the field
 * itself. A flag tracking the same thing has to be written at every point the
 * field can come to rest displaced, and on this component two separate review
 * findings were places where one such write had been missed.
 */
export function fieldNeedsResume(
  maxDisplacement: number,
  epsilon = SETTLE_EPSILON_PX,
  damping = DAMPING
): boolean {
  return maxDisplacement * damping > epsilon;
}

export type TransitInfluence = {
  weight: number;
  /** Unit push direction — the travel axis, handed back so callers need no trig. */
  ux: number;
  uy: number;
};

/**
 * A wavefront crossing the field on its own, independent of the cursor: dots
 * within a band of the moving front brighten and drift along the direction of
 * travel, then relax behind it.
 *
 * `spanLo` and `span` describe the field's extent along the axis and MUST be
 * derived from the particle set, not the canvas. The density mask weights the
 * field to the right of the hero and fades it out entirely on the left, so
 * canvas-derived extents put roughly a third of every sweep in empty space —
 * measured at 700x250, a corner-derived front engaged zero dots for the first
 * 30% of its travel and then jumped to 97.
 *
 * `axisX`/`axisY` MUST be a unit vector. `baseX * axisX + baseY * axisY` is a
 * distance along the axis only when |axis| = 1, and the axis is handed straight
 * back as `ux`/`uy` for the caller to scale by TRANSIT_DRIFT_PX — so a non-unit
 * axis silently mis-scales both the front's position and the drift it applies, in
 * proportion to its length. No runtime check: there is one caller and it builds
 * the axis from Math.cos/Math.sin of TRANSIT_AXIS_RADIANS, which is unit by
 * construction. The same axis must produce `spanLo` and `span`.
 *
 * The front starts one full band *before* the field and ends one band past it,
 * so a transit opens and closes with genuine no-ops rather than popping into
 * existence mid-field.
 *
 * Returns `null` — not a zero-weight object — for every particle the front is
 * nowhere near, which is about 72% of the field at peak.
 */
export function transitInfluence(
  baseX: number,
  baseY: number,
  axisX: number,
  axisY: number,
  spanLo: number,
  span: number,
  progress: number,
  bandFraction = TRANSIT_BAND_FRACTION
): TransitInfluence | null {
  // Outside the sweep window there is no front. This earns its place twice over,
  // and neither reason is "it stops an out-of-range progress reaching the field":
  // the front launches a full band before spanLo, so no progress outside [0, 1]
  // can put it within a band of any particle inside the extent anyway.
  //
  //   It is the early-out for -1, the caller's no-transit sentinel. Between
  //   transits — which is most of the time, given a 40-70s gap — this skips a
  //   projection and a smoothstep for every particle in the field, ~1000 per
  //   frame.
  //
  //   Written as a negated total range, it also refuses NaN. `NaN < 0` and
  //   `NaN > 1` are both false, so the two-comparison form let a NaN progress
  //   through and returned { weight: NaN }, which the caller multiplies into a
  //   canvas coordinate: those dots silently stop drawing, with nothing logged to
  //   trace it by, exactly as in smoothstep's 0/0 case above. The caller derives
  //   progress from timestamps, so a zero-duration transit is one 0/0 away.
  if (!(progress >= 0 && progress <= 1)) return null;
  // A degenerate extent has no band to sweep, and this says so here rather than
  // leaving the answer to another function. Unguarded, both cases already return
  // null, but only via smoothstep's internals: band comes out zero or negative,
  // smoothstep's own `edge1 <= edge0` guard returns 1, weight is 0, and the
  // `weight <= 0` return below fires. Correct today, but correct by accident —
  // change smoothstep's degenerate branch and this function's contract changes
  // with it, silently. The corollary is that no caller can tell the two null
  // paths apart, so the tests covering this line document intent; they cannot
  // detect its removal.
  if (span <= 0 || bandFraction <= 0) return null;

  const band = span * bandFraction;
  const projected = baseX * axisX + baseY * axisY;
  const front = spanLo - band + (span + 2 * band) * progress;
  const weight = 1 - smoothstep(0, band, Math.abs(projected - front));
  if (weight <= 0) return null;

  return { weight, ux: axisX, uy: axisY };
}
