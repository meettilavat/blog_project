"use client";

import { useEffect, useRef } from "react";
import {
  COMBINED_PULL_CAP_PX,
  LENS_ALPHA_GAIN,
  TRANSIT_ALPHA_GAIN,
  TRANSIT_AXIS_RADIANS,
  TRANSIT_DRIFT_PX,
  TRANSIT_FIRST_DELAY_MS,
  TRANSIT_MAX_GAP_MS,
  TRANSIT_MIN_GAP_MS,
  TRANSIT_MS,
  clampMagnitude,
  composeAlpha,
  fieldIsSettled,
  fieldNeedsResume,
  lensInfluence,
  parallaxOffset,
  particleDepth,
  stepToward,
  transitInfluence
} from "@/lib/field/field-motion";

const DRIFT_MS = 1000;
const CONDENSE_MS = 1500;

// How long resize notifications are coalesced before the field is rebuilt.
// Exported so the tests drive the debounce by the value the field actually uses
// rather than by a literal that silently stops matching when this is retuned.
export const RESIZE_DEBOUNCE_MS = 120;

// Interaction is for cursors only. Touch devices keep exactly today's behaviour:
// condense once, then hold a static settled frame.
const INTERACTIVE_QUERY = "(hover: hover) and (pointer: fine)";

// Module-level play-once registry, keyed by title (spec §5.3): the field
// condenses once per featured essay, then holds a static settled frame.
const playedSlugs = new Set<string>();

export function __playedSlugs() {
  return playedSlugs;
}
export function __resetPlayedSlugs() {
  playedSlugs.clear();
}

// Dev-only frame counter for the §10 frame budget. It counts frames *executed*:
// no frames once the field has stopped moving, cursor present or not, and none
// while the hero is offscreen or the document is hidden. The two halves are
// enforced differently — `schedule()` refuses outright while offscreen, whereas
// the hidden-document half relies on the browser suspending rAF, since a mount
// in a background tab deliberately leaves its first frame queued.
export const __frameCount = { value: 0 };

type Particle = {
  hx: number;
  hy: number;
  tx: number;
  ty: number;
  x: number;
  y: number;
  a: number;
  /** Render alpha for the current frame; lensing raises it above `a`. */
  ra: number;
  /** 0 (far) .. 1 (near), derived from `a`. Drives parallax magnitude. */
  depth: number;
};

function makeSeededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Stable per-title seed so each featured essay gets a subtly different field
// without ever spelling anything.
function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// The field is an abstract, jittered dot lattice spanning the whole hero: barely
// present at the left, thickening steadily rightward into the page gutter. It
// never forms letters, never clips at the canvas edge, and stays faint enough to
// read as a backdrop rather than compete with the SSR'd headline above it.
// (User-approved evolution of spec §5's typed-title field.)
function buildFieldTargets(
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

/**
 * Imperative core of the field, split out of the effect so its frame budget can
 * be driven directly under test. Vitest runs `environment: "node"`, so there is
 * no DOM to mount into and no real `requestAnimationFrame` to observe — the
 * guarantees this code exists to provide (zero frames when idle, offscreen, or
 * hidden) are only observable by stepping the loop by hand. The component below
 * is the only production caller; `tests/support/field-harness.ts` supplies the
 * platform for the other.
 *
 * Returns the teardown for every listener, observer, and frame it owns.
 */
export function startField(canvas: HTMLCanvasElement, title: string): () => void {
  const ctx = canvas.getContext("2d");
  // Context failure: nothing starts, so nothing needs tearing down. The
  // headline is SSR'd beneath, so the hero degrades to plain type.
  if (!ctx) return () => {};


  // If this title already played, skip the condense and go straight to
  // settled — the field is then interactive without replaying its entrance.
  const alreadyPlayed = playedSlugs.has(title);

  const seed = hashString(title || "field");

  // Mutable because a resize rebuilds all of it. `width`/`height` *define* the
  // field's coordinate space, and every particle coordinate lives in that space.
  let width = 1;
  let height = 1;
  let particles: Particle[] = [];

  // ---- transit state ----
  // Declared above `measure()` because `measure()` assigns the axis extents
  // below, and it runs once before anything else in this function: a `let`
  // declared further down would still be in its temporal dead zone by then and
  // that first assignment would throw.
  //
  // `transitStart` is the rAF timestamp the current transit began, or -1 for
  // none. Never set from a setTimeout callback: the timer raises
  // `transitPending` and the next frame stamps the start from its own clock. A
  // timer callback has no timestamp of its own, so stamping it there means
  // reading some other clock, and `progress` is then wrong by whatever separates
  // that clock's origin from rAF's — for `Date.now()`, the whole Unix epoch,
  // which drives `progress` so far out of [0, 1] that no dot ever renders.
  let transitStart = -1;
  let transitPending = false;
  let transitTimer = 0;
  // Travel axis and the field's extent along it. Recomputed by measure().
  let axisX = Math.cos(TRANSIT_AXIS_RADIANS);
  let axisY = Math.sin(TRANSIT_AXIS_RADIANS);
  let spanLo = 0;
  let span = 0;

  // A generator of its own, deliberately not the one `measure()` uses for
  // particle home positions. That one is re-seeded on every rebuild, so a shared
  // stream would restart mid-cadence; and sharing would make the two
  // order-dependent, so how many gaps had been drawn would change where every
  // particle sits — which is exactly what "produces an identical field when
  // rebuilt at the same size" forbids.
  const cadenceRand = makeSeededRandom(seed ^ 0x5bf03635);
  const randomGap = () =>
    TRANSIT_MIN_GAP_MS + cadenceRand() * (TRANSIT_MAX_GAP_MS - TRANSIT_MIN_GAP_MS);

  // `wake` is declared further down but only *called* here, from a timer
  // callback, so its `const` is long since initialised by the time this runs —
  // the same arrangement `tick` already uses. `onscreen` is read in the body
  // rather than a callback, which is a tighter constraint, but still satisfied:
  // the earliest call to this function is the settled-mount path below, well
  // after `onscreen` is declared, and every other call site is a frame, an
  // observer callback, or a timer.
  const armTransit = (delayMs: number) => {
    if (transitTimer) clearTimeout(transitTimer);
    transitTimer = 0;
    // This line and the guard below split one postcondition between them: after
    // `armTransit` returns, a transit is scheduled or dropped, never left pending.
    // This is the hidden-tab half, and on that path it is the only thing that
    // lowers the flag at all.
    //
    // The guard below is `onscreen`, which tracks *intersection*; nothing here
    // tests `document.hidden`. So a transit can be armed, come due, and raise
    // `transitPending` entirely inside a hidden tab — after `onVisibility`'s hidden
    // branch has already disarmed — leaving `onVisibility`'s resume to run with the
    // flag up. Two callers arm from that state, both measured:
    //
    //   `applyResize`. A ResizeObserver notification is delivered regardless of
    //   visibility, and a background tab *throttles* setTimeout rather than
    //   suspending it, so a debounce armed just before a tab switch comes due while
    //   hidden and arms a gap behind the hidden branch's back.
    //
    //   The settled-mount path below, for a repeat visit (`alreadyPlayed`) mounting
    //   into a background tab. A mount gets no visibilitychange on the way in, so
    //   nothing has disarmed anything yet.
    //
    // The gap then elapses while hidden and the timer's `wake()` accepts — it tests
    // `onscreen`, not `document.hidden`, deliberately, because the hidden half of
    // the frame budget rests on the engine suspending rAF. Come the resume,
    // `armTransit` is reached with the flag raised, no cursor, and a field already
    // at base, so nothing schedules, and the flag then stays up until either a
    // gate disarms or — the case that shows — the visitor's cursor touches the hero
    // and opens a full sweep on the spot instead of at the end of a gap. Measured
    // both ways: 106 frames, lifting dots outside the cursor's lens radius to the
    // 0.85 ceiling, against 25 frames of pure lens with this line in place.
    transitPending = false;
    // The offscreen half: no timer exists at all while offscreen, rather than one
    // whose callback `wake()` will refuse and whose raised flag nothing would then
    // lower. `applyResize` and the visibility gate both reach here while the hero is
    // scrolled away, and for them this early return *is* the drop the spec asks for.
    // Both gates assign `onscreen` before they arm, so a hero scrolling back into
    // view still gets a fresh gap.
    if (!onscreen) return;
    transitTimer = window.setTimeout(() => {
      transitTimer = 0;
      transitPending = true;
      wake();
    }, delayMs);
  };

  const disarmTransit = () => {
    if (transitTimer) clearTimeout(transitTimer);
    transitTimer = 0;
    transitPending = false;
    transitStart = -1;
  };

  /**
   * Reads the element's box and rebuilds everything derived from it: the backing
   * buffer, the dpr transform, and the particle set.
   *
   * Called at mount and on every debounced resize. Before this existed the field
   * measured once and never again, so a later change to the element's box left
   * the browser stretching a stale bitmap over a new one while the pointer
   * handler compared live coordinates against the stale particle positions.
   */
  const measure = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    // Reset before scaling rather than folding into whatever transform is
    // already there. `ctx.scale` multiplies, so on the second call the
    // difference is 2x versus 4x — a field drawn at double size with three
    // quarters of it off-canvas. Resetting explicitly is what makes this
    // function's postcondition — the transform is exactly the dpr scale, on
    // every call — hold on its own terms, rather than depending on the
    // assignments above having cleared it. That dependency would be load-bearing
    // because a rebuild can assign `canvas.width`/`canvas.height` the values
    // they already hold: a window moved between displays so that dpr and the CSS
    // box change by reciprocal factors passes `applyResize`'s integer guard on
    // the CSS box while the buffer dimensions come out unchanged.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const targets = buildFieldTargets(width, height, seed);
    // Seeded here rather than once per field, which is what keeps `measure()` a
    // pure function of the box: it feeds the entrance home positions, and a
    // stream shared across calls would hand two rebuilds at one size different
    // ones. Only the mount's call is ever read, since a rebuild ends the
    // entrance — so this is reproducibility, not a bug being held off.
    const layoutRand = makeSeededRandom(seed ^ 0x9e3779b9);

    let minAlpha = Number.POSITIVE_INFINITY;
    let maxAlpha = Number.NEGATIVE_INFINITY;
    for (const t of targets) {
      if (t.a < minAlpha) minAlpha = t.a;
      if (t.a > maxAlpha) maxAlpha = t.a;
    }

    particles = targets.map((t) => {
      const hx = layoutRand() * width;
      const hy = layoutRand() * height;
      return {
        hx,
        hy,
        tx: t.x,
        ty: t.y,
        // Built at rest rather than at `hx`/`hy`: a rebuild has to leave the
        // field settled, and `tick` assigns `p.x = p.hx` on its first drift
        // frame before anything is drawn, so the entrance is unaffected.
        x: t.x,
        y: t.y,
        a: t.a,
        ra: t.a,
        depth: particleDepth(t.a, minAlpha, maxAlpha)
      };
    });

    // Extents along the travel axis, from the particles rather than the canvas:
    // the density mask clears the left of the hero, so canvas-derived extents
    // would spend a third of every sweep crossing empty space.
    //
    // Recomputed from the constant rather than carried over, so this function's
    // postcondition covers the axis too: `transitInfluence` requires that the
    // same unit axis produced `spanLo`/`span`, and deriving it here is what makes
    // that true by construction on every call.
    axisX = Math.cos(TRANSIT_AXIS_RADIANS);
    axisY = Math.sin(TRANSIT_AXIS_RADIANS);
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const p of particles) {
      const projected = p.tx * axisX + p.ty * axisY;
      if (projected < lo) lo = projected;
      if (projected > hi) hi = projected;
    }
    // A rebuild can legitimately produce no particles at all — a hero collapsed
    // to 1x1 after mount reaches `applyResize`, which keeps the field running —
    // and that leaves lo/hi infinite. `span` of 0 is what `transitInfluence`
    // guards on, so a degenerate field simply has no transit.
    spanLo = Number.isFinite(lo) ? lo : 0;
    span = Number.isFinite(hi - lo) ? Math.max(0, hi - lo) : 0;
  };

  measure();

  // A zero-size hero — `display: none`, a collapsed flex parent, a measurement
  // taken before layout — clamps to 1x1 and yields no targets. There is nothing
  // to animate, so bail before wiring anything up rather than spending a full
  // entrance painting an empty canvas.
  //
  // This bail also means such a hero never gets a ResizeObserver, so it cannot
  // recover when it later gains a box. That matches the behaviour before the
  // observer existed and is left alone deliberately: fixing it means
  // restructuring the teardown contract, which belongs in its own change.
  if (!particles.length) return () => {};

  let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#F2A93B";
  let raf = 0;
  let start = 0;
  let condensing = !alreadyPlayed;
  let onscreen = true;
  let pointer: { x: number; y: number; nx: number; ny: number } | null = null;
  // True only while a resize has been observed but deliberately withheld because
  // the entrance is still running. `tick`'s terminal branch is the sole consumer.
  let resizePending = false;

  const interactive = window.matchMedia(INTERACTIVE_QUERY).matches;

  const draw = () => {
    __frameCount.value++;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = accent;
    for (const p of particles) {
      ctx.globalAlpha = p.ra;
      ctx.fillRect(p.x, p.y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  };

  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  // Every frame is requested through here, so the invariant "`raf` is non-zero
  // iff a frame is queued" lives in one place instead of being hand-maintained
  // at each call site. Cancelling first makes double-scheduling structurally
  // impossible, and refusing while offscreen makes the zero-frames-offscreen
  // guarantee hold no matter which caller forgot to check.
  const schedule = (callback: FrameRequestCallback) => {
    if (raf) cancelAnimationFrame(raf);
    raf = onscreen ? requestAnimationFrame(callback) : 0;
  };

  const cancel = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  /**
   * Whether the field is far enough from base that another frame would move it.
   * This is what a gate asks before resuming: a cursor that left mid-return, a
   * transit abandoned mid-sweep, or anything else that stopped the loop while the
   * dots were still travelling all answer yes, and a field at rest answers no, so
   * a resume with nothing outstanding still costs nothing.
   *
   * Measured rather than tracked. This replaced a `returnPending` flag that had
   * seven writers, and two separate review findings on this file were places where
   * one of those writes had been missed — the transit's tail, which cleared
   * `transitStart` while the dots were still 1.9px out, and the abandon path. A
   * flag has to be maintained everywhere the field can come to rest displaced; a
   * measurement is true whenever it is true.
   */
  const fieldNeedsWork = () => {
    let worst = 0;
    for (const p of particles) {
      const displacement = Math.max(Math.abs(p.x - p.tx), Math.abs(p.y - p.ty));
      if (displacement > worst) worst = displacement;
    }
    return fieldNeedsResume(worst);
  };

  // ---- condense (unchanged entrance) ----
  const tick = (now: number) => {
    // Defensive: `schedule()` refuses offscreen and the gates cancel on the way
    // out, so this should be unreachable. Zero `raf` anyway — a stale handle
    // here would block `wake()` for the rest of the field's life.
    if (!condensing || !onscreen) {
      raf = 0;
      return;
    }
    if (!start) start = now;
    const elapsed = now - start;
    if (elapsed < DRIFT_MS) {
      for (const p of particles) {
        p.x = p.hx;
        p.y = p.hy + Math.sin((now + p.hx) * 0.001) * 2;
      }
      draw();
      schedule(tick);
    } else if (elapsed < DRIFT_MS + CONDENSE_MS) {
      const t = ease((elapsed - DRIFT_MS) / CONDENSE_MS);
      for (const p of particles) {
        p.x = p.hx + (p.tx - p.hx) * t;
        p.y = p.hy + (p.ty - p.hy) * t;
      }
      draw();
      schedule(tick);
    } else {
      // A resize that arrived mid-entrance was deferred to here, so the condense
      // could finish undisturbed. Rebuild before the snap and paint below — the
      // snap has to write the rebuilt particles, not the ones being replaced —
      // and re-check the box, which may have changed again, or back, while the
      // entrance played out.
      if (resizePending) {
        resizePending = false;
        const rect = canvas.getBoundingClientRect();
        if (Math.floor(rect.width) !== width || Math.floor(rect.height) !== height) {
          measure();
          // Old-space coordinates, same as on the immediate path.
          pointer = null;
        }
      }
      for (const p of particles) {
        p.x = p.tx;
        p.y = p.ty;
      }
      draw();
      playedSlugs.add(title);
      condensing = false;
      armTransit(TRANSIT_FIRST_DELAY_MS);
      raf = 0; // SETTLED: this chain ends here
      // A cursor that arrived during the entrance is already inside the hero,
      // so hand it the lens now rather than making it move again to be noticed.
      if (pointer) {
        wake();
      } else {
        // Every particle was just snapped to base, so a return armed by a cursor
        // that left *during* the entrance has nothing left to run: `wake()`
        // declined it at the time (condensing), and the entrance finished the
        // job. Clearing it here is the same statement `interactiveTick` makes on
        // its own settle path — both terminal paths agree that at base with no
        // cursor means nothing is outstanding — and it is what keeps the next
        // visibility or intersection resume from spending a frame to rediscover
        // that and repaint an identical field.
      }
    }
  };

  // ---- engaged (parallax + lensing + transit, damped) ----
  const interactiveTick = (now: number) => {
    // `interactive` is deliberately absent: a transit must run on a touch device,
    // where there is no cursor to relieve a frozen field. Pointer influence is
    // gated per-particle below instead.
    //
    // `!onscreen` is vestigial — `schedule()` refuses while offscreen and the
    // gates cancel on the way out — but it costs nothing and zeroing `raf` here
    // keeps a stale handle from ever blocking `wake()`.
    if (!onscreen || condensing) {
      raf = 0;
      return;
    }

    // The timer only raised a flag; this is where the transit gets its clock, so
    // that `now` and `transitStart` are always two readings of the same one.
    if (transitPending) {
      transitPending = false;
      transitStart = now;
    }

    const progress = transitStart < 0 ? -1 : (now - transitStart) / TRANSIT_MS;
    if (transitStart >= 0 && progress > 1) {
      transitStart = -1;
      // The front leaves the field at progress ~0.92, so the sweep ends with the
      // dots still displaced — measured 1.95px at 800x400, against the 0.36px
      // (SETTLE_EPSILON_PX / DAMPING) residual the loop halts at — and the relax
      // behind it continues with no transit in flight. `disarmTransit` only raises
      // this flag `if (transitStart >= 0)`, so from here on it would not: going
      // offscreen inside that window and coming back schedules nothing and strands
      // the field 5x the residual off base until the next hover or transit. This
      // says the same thing the flag says everywhere else — the dots are walking
      // home — and the settle path below clears it again on arrival.
      armTransit(randomGap());
    }

    let maxDelta = 0;
    for (const p of particles) {
      let targetX = p.tx;
      let targetY = p.ty;
      // Pulls accumulate separately from the target so one cap can bound their
      // sum; a transit wavefront will add a second contributor to all three.
      //
      // `gain` is the odd one out and the split is deliberate, not an oversight:
      // each influence's gain coefficient is applied here at the call site, while
      // the ceiling that bounds their total lives in `composeAlpha`. That is the
      // whole point of the arrangement — an influence returning an
      // already-ceilinged alpha cannot be combined with another one.
      let pullX = 0;
      let pullY = 0;
      let gain = 0;

      // `interactive` as well as `pointer`, so the touch-device guarantee is
      // checkable here rather than resting on the listener wiring 150 lines down.
      if (interactive && pointer) {
        // Parallax is a depth offset, not a pull: it applies straight to the
        // target and stays outside the pull cap, bounded separately by
        // PARALLAX_MAX_PX. Capping it alongside the pulls would fight the depth
        // effect it exists to create.
        targetX += parallaxOffset(pointer.nx, p.depth);
        targetY += parallaxOffset(pointer.ny, p.depth);
        const lens = lensInfluence(p.tx, p.ty, pointer.x, pointer.y);
        pullX += lens.pullX;
        pullY += lens.pullY;
        gain += lens.weight * LENS_ALPHA_GAIN;
      }

      if (transitStart >= 0) {
        // Reads `p.tx`/`p.ty`, the settled target, because that is the space the
        // front is positioned in. `measure()` derives `spanLo` and `span` from
        // `p.tx * axisX + p.ty * axisY`, and `transitInfluence` places the front
        // by mapping `progress` onto exactly that extent — so the projection it
        // compares the front against has to be measured in the same space, which
        // is its documented contract. Projecting `p.x`/`p.y` instead would offset
        // every dot by whatever parallax and drift it happens to be carrying, and
        // the front and the dots would be positions in two different coordinate
        // systems: the same dot would then meet the front at a different
        // `progress` on a hovered field than on an untouched one.
        const sweep = transitInfluence(p.tx, p.ty, axisX, axisY, spanLo, span, progress);
        if (sweep) {
          pullX += sweep.ux * sweep.weight * TRANSIT_DRIFT_PX;
          pullY += sweep.uy * sweep.weight * TRANSIT_DRIFT_PX;
          gain += sweep.weight * TRANSIT_ALPHA_GAIN;
        }
      }

      targetX += clampMagnitude(pullX, COMBINED_PULL_CAP_PX);
      targetY += clampMagnitude(pullY, COMBINED_PULL_CAP_PX);

      const nextX = stepToward(p.x, targetX);
      const nextY = stepToward(p.y, targetY);
      const delta = Math.max(Math.abs(nextX - p.x), Math.abs(nextY - p.y));
      if (delta > maxDelta) maxDelta = delta;
      p.x = nextX;
      p.y = nextY;
      p.ra = composeAlpha(p.a, gain);
    }

    draw();

    // Halt as soon as the field stops moving, pointer or not. A motionless
    // cursor means the field has reached its lensed target and further paints
    // are identical, so the next `pointermove` re-arms the loop through
    // `wake()` — `raf` is 0 by then, so that guard cannot swallow it.
    //
    // But not while a transit is in flight. Its opening frames have zero weight
    // everywhere, because the front starts a full band outside the field, so a
    // settle test that ignored the transit would end the chain before the front
    // reached a single dot and the sweep would never render at all.
    if (fieldIsSettled(maxDelta) && transitStart < 0) {
      raf = 0; // this chain ends here
      return;
    }
    schedule(interactiveTick);
  };

  // `!interactive` is absent here too: the transit timer wakes the loop on touch
  // devices, which have no cursor to do it. The `raf` test still keeps pointer
  // spam from cancelling and re-requesting a frame that is already queued for the
  // very same work. `!onscreen` is vestigial for the same reason as in
  // `interactiveTick`: `schedule()` would refuse anyway.
  const wake = () => {
    if (!onscreen || condensing || raf) return;
    schedule(interactiveTick);
  };

  if (condensing) {
    schedule(tick);
  } else {
    for (const p of particles) {
      p.x = p.tx;
      p.y = p.ty;
    }
    draw();
    // The play-once registry sends a repeat visit straight to a settled frame, so
    // this is the only place its schedule can be armed: `tick`'s terminal branch
    // never runs for it.
    armTransit(TRANSIT_FIRST_DELAY_MS);
  }

  // Listeners go on the host, not the canvas: the canvas stays
  // pointer-events-none so the headline link keeps its own hover and focus.
  const host = canvas.parentElement;

  const onPointerMove = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    // Scale into field space. Particle coordinates live in the space `measure()`
    // captured; `bounds` is live. The two agree in the common case, and this makes
    // them agree in every case — including a box that changed without notifying
    // the observer, which is exactly how the Safari offset arose.
    const x = (event.clientX - bounds.left) * (width / bounds.width);
    const y = (event.clientY - bounds.top) * (height / bounds.height);
    // Normalised against `width`, not `bounds.width`: `x` is already in field
    // space, and mixing the two spaces in one object is what caused the bug.
    pointer = { x, y, nx: x / width, ny: y / height };
    wake();
  };

  const onPointerLeave = () => {
    pointer = null;
    wake(); // wake to run the damped return, which then halts itself
  };

  if (interactive && host) {
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
  }

  /**
   * The two halves of a gate transition, shared by the intersection and visibility
   * observers so "the gates agree" is a fact rather than a diff-by-eye claim.
   *
   * They were duplicated verbatim before, and that is how the hidden-tab bug
   * survived a review: the bodies matched textually while their reachability
   * differed, so only one of the two got reasoned about.
   */
  const suspend = () => {
    cancel();
    disarmTransit();
  };

  const resume = () => {
    if (condensing) {
      schedule(tick);
      return;
    }
    // A fresh gap, never the remainder: otherwise scrolling back fires a transit
    // instantly, and so does a tab left open all afternoon.
    armTransit(randomGap());
    // An interrupted return still has to finish, or the field holds a part-lensed
    // frame until the next hover. An abandoned sweep is one of those returns, and
    // `fieldNeedsWork` sees it without anything having had to flag it.
    if (pointer || fieldNeedsWork()) wake();
  };

  // Zero frames while the hero is offscreen (spec §5.1).
  const fieldObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible === onscreen) return;
      onscreen = visible;
      if (!onscreen) {
        suspend();
        return;
      }
      resume();
    },
    { rootMargin: "0px" }
  );
  fieldObserver.observe(canvas);

  const onVisibility = () => {
    if (document.hidden) {
      suspend();
      return;
    }
    // `schedule()` cancels before it requests, so this `cancel()` is no longer
    // what prevents a second chain — it is belt-and-braces, kept for one narrow
    // reason. A non-zero `raf` here provably denotes a live queued
    // `interactiveTick` (every terminal path zeroes the slot), so `wake()`
    // declining would be correct if the engine merely *suspends* callbacks in a
    // hidden document. Clearing first also covers an engine that *drops* them,
    // where declining would freeze the field for good. Cheap insurance against
    // a behaviour we cannot observe from here.
    cancel();
    resume();
  };
  document.addEventListener("visibilitychange", onVisibility);

  // One retint repaint on theme change (spec §5.5): re-read --accent when the
  // `dark` class flips; repaint once only if the loop is idle.
  const onThemeChange = () => {
    accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
    if (!raf) draw();
  };
  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // ---- resize: re-measure rather than stretch a stale bitmap ----
  let resizeTimer = 0;

  const applyResize = () => {
    resizeTimer = 0;
    const rect = canvas.getBoundingClientRect();
    // Only act on a real change — i.e. would `measure()` come out at a different
    // size? Sub-pixel churn (a scrollbar appearing, a font swap settling) must
    // not throw the field away for a fractional difference. Clamped the same way
    // `measure()` clamps, or a hero collapsed to zero after mount would never
    // compare equal to the 1x1 it produced and every notification would cost a
    // rebuild plus an empty repaint. It still compares unequal on the way back
    // up, so recovery when the hero regrows is unaffected.
    if (
      Math.max(1, Math.floor(rect.width)) === width &&
      Math.max(1, Math.floor(rect.height)) === height
    ) {
      return;
    }

    // A resize during the entrance is deferred, not applied: `measure()`
    // regenerates the very home positions the condense is interpolating from, so
    // rebuilding mid-flight would either jump or cut the entrance short. And this
    // is not the rare case the rest of this path is written for — every font in
    // the public app loads `display: "swap"`, so on a cold load the fallback lays
    // out the `text-balance` headline, the real face arrives a few hundred ms in,
    // the hero's height changes, and this fires well inside the 2.5s entrance.
    // Truncating the condense there would mean most first-time visitors never see
    // it. The entrance runs to completion on slightly stale geometry — dots in
    // motion cannot betray that their targets were computed for a hero ten pixels
    // shorter — and `tick`'s terminal branch rebuilds the moment it lands.
    if (condensing) {
      resizePending = true;
      return;
    }

    measure();
    // The stored pointer is in the *old* field space, which is the whole bug this
    // path exists to fix. Drop it; the next pointermove re-establishes it in the
    // new space. Particles are rebuilt at rest, so nothing is outstanding.
    pointer = null;
    disarmTransit();
    // The rebuilt field is snapped to base, so unlike the offscreen case there is
    // nothing left to walk home and no gate will find work to resume.
    armTransit(randomGap());
    // Resizing the bitmap cleared it, so this repaint is what keeps the hero from
    // sitting blank: with nothing outstanding, no gate would schedule a frame.
    // Unconditional, and any queued frame is dropped first. Deferring to a frame
    // that happens to be in flight is not equivalent — the intersection gate
    // cancels it if the hero scrolls away, and on the way back nothing resumes,
    // because the two lines above are exactly what the gates test. The hero would
    // then hold the cleared bitmap until the next pointermove, theme flip, or
    // resize. Cancelling costs nothing: the field was just rebuilt at rest with
    // no pointer, so that frame had only an identical paint left to do.
    cancel();
    draw();
  };

  const fieldResizeObserver = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyResize, RESIZE_DEBOUNCE_MS);
  });
  fieldResizeObserver.observe(canvas);

  return () => {
    condensing = false;
    pointer = null;
    resizePending = false;
    cancel();
    disarmTransit();
    if (host) {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    }
    document.removeEventListener("visibilitychange", onVisibility);
    if (resizeTimer) clearTimeout(resizeTimer);
    fieldResizeObserver.disconnect();
    fieldObserver.disconnect();
    themeObserver.disconnect();
  };
}

export default function HeroField({ title }: { title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startField(canvas, title);
  }, [title]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      tabIndex={-1}
    />
  );
}
