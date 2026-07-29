/**
 * Per-frame motion arithmetic for the hero particle field: parallax, the cursor
 * lens, damping, and the settle test. Kept free of DOM and canvas references so
 * it is unit-testable under Vitest's `node` environment.
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

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampMagnitude(value: number, cap: number): number {
  return Math.min(cap, Math.max(-cap, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
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
  // reachable domain: the sole call site passes edge0 = 0 and Math.hypot() for
  // x, so x >= edge0 always. Returning `x < edge0 ? 0 : 1` instead would read as
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
  alpha: number;
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
  alpha: number,
  radius = LENS_RADIUS_PX
): LensInfluence {
  const dx = pointerX - baseX;
  const dy = pointerY - baseY;
  const weight = 1 - smoothstep(0, radius, Math.hypot(dx, dy));
  if (weight <= 0) {
    return { pullX: 0, pullY: 0, alpha };
  }
  return {
    pullX: clampMagnitude(dx * weight * LENS_PULL, LENS_PULL_CAP_PX),
    pullY: clampMagnitude(dy * weight * LENS_PULL, LENS_PULL_CAP_PX),
    alpha: Math.min(LENS_ALPHA_CAP, alpha * (1 + weight * LENS_ALPHA_GAIN))
  };
}

export function stepToward(current: number, target: number, damping = DAMPING): number {
  return current + (target - current) * damping;
}

export function fieldIsSettled(maxDelta: number, epsilon = SETTLE_EPSILON_PX): boolean {
  return maxDelta < epsilon;
}
