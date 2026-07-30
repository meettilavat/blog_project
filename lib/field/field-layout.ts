/**
 * Where the field's dots go, as opposed to how they move once they are there.
 *
 * Split from `field-motion.ts` on purpose: that module is the arithmetic the frame
 * loop runs every tick, this one is the one-off layout a rebuild computes. Both are
 * pure and DOM-free so they stay unit-testable under Vitest's `node` environment,
 * and both were stranded inside the component until the field's own reviews kept
 * pointing out that the seeding and masking had no direct tests of their own.
 */
import { smoothstep } from "@/lib/field/field-motion";

export function makeSeededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Stable per-title seed so each featured essay gets a subtly different field
// without ever spelling anything.
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// The field is an abstract, jittered dot lattice spanning the whole hero: barely
// present at the left, thickening steadily rightward into the page gutter. It
// never forms letters, never clips at the canvas edge, and stays faint enough to
// read as a backdrop rather than compete with the SSR'd headline above it.
// (User-approved evolution of spec §5's typed-title field.)
export function buildFieldTargets(
  width: number,
  height: number,
  seed: number
): Array<{ x: number; y: number; a: number }> {
  const rand = makeSeededRandom(seed);
  const step = Math.max(12, Math.round(Math.min(width, height) / 46));
  const targets: Array<{ x: number; y: number; a: number }> = [];

  for (let gy = step * 0.5; gy < height; gy += step) {
    for (let gx = step * 0.5; gx < width; gx += step) {
      const nx = gx / width; // 0 (left) .. 1 (right)
      const ny = gy / height; // 0 (top) .. 1 (bottom)

      // One gradient across the entire hero: a scattering at the left that
      // thickens all the way to full strength in the page gutter on the right.
      //
      // Spanning the full width rather than starting past the headline is the
      // owner's call, and it is what makes the field read as composed instead of
      // placed: dots behind the type are sparse and faint enough to be texture,
      // and the eye follows the density up to the right. Confining it to the
      // gutter instead — which the canvas now reaches, since `.hero-bleed` widens
      // the section past the 72rem text container — left it looking squeezed,
      // because the container caps while the viewport keeps growing, so the clear
      // band is a shrinking share of an ever-wider canvas.
      //
      // The ramp ends before the canvas edge so the densest part is a body of
      // field rather than a hard stop, and starts just inside it so the far left
      // stays clear of the kicker and nav.
      const horizontal = smoothstep(0.05, 0.90, nx);
      // Float the band away from the top and bottom edges.
      const vertical = 0.32 + 0.68 * Math.sin(Math.PI * ny);
      // Bias the mass toward the upper-right for an asymmetric, drifting feel.
      const diagonal = 0.66 + 0.34 * smoothstep(0.15, 1, nx - (ny - 0.5) * 0.55);

      let presence = horizontal * vertical * diagonal;
      presence *= 0.74 + 0.5 * rand(); // organic thinning
      if (presence < 0.16) continue;

      // Jitter off the lattice so it reads as scattered, not a rigid grid.
      const jx = (rand() - 0.5) * step * 0.72;
      const jy = (rand() - 0.5) * step * 0.72;

      targets.push({
        x: Math.min(width - 1, Math.max(0, gx + jx)),
        y: Math.min(height - 1, Math.max(0, gy + jy)),
        a: Math.min(0.66, 0.16 + presence * 0.58)
      });
    }
  }

  return targets;
}
