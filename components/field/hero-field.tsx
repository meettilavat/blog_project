"use client";

import { useEffect, useRef } from "react";
import {
  fieldIsSettled,
  lensInfluence,
  parallaxOffset,
  particleDepth,
  stepToward
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

// The field is an abstract, jittered dot lattice masked into the hero's right /
// upper negative space, fading out toward the left where the headline lives. It
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

      // Weight density to the right third, clear of where the headline begins,
      // reaching full strength before the canvas edge so it reads as a body of
      // field rather than a thinning fringe.
      const horizontal = smoothstep(0.30, 0.82, nx);
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
  // True only while the cursor has left but the damped return has not reached
  // base yet. The gates use it to finish an interrupted return, which keeps the
  // departing cursor as well served as the arriving one — and because it is
  // false whenever the field is at rest, a resume with nothing outstanding still
  // schedules nothing.
  let returnPending = false;
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
        returnPending = false;
      }
    }
  };

  // ---- engaged (parallax + lensing, damped) ----
  const interactiveTick = () => {
    // `!onscreen` is vestigial — `schedule()` refuses while offscreen and the
    // gates cancel on the way out — but it costs nothing and zeroing `raf` here
    // keeps a stale handle from ever blocking `wake()`.
    if (!interactive || !onscreen || condensing) {
      raf = 0;
      return;
    }

    let maxDelta = 0;
    for (const p of particles) {
      let targetX = p.tx;
      let targetY = p.ty;
      let alpha = p.a;

      if (pointer) {
        targetX += parallaxOffset(pointer.nx, p.depth);
        targetY += parallaxOffset(pointer.ny, p.depth);
        const lens = lensInfluence(p.tx, p.ty, pointer.x, pointer.y, p.a);
        targetX += lens.pullX;
        targetY += lens.pullY;
        alpha = lens.alpha;
      }

      const nextX = stepToward(p.x, targetX);
      const nextY = stepToward(p.y, targetY);
      const delta = Math.max(Math.abs(nextX - p.x), Math.abs(nextY - p.y));
      if (delta > maxDelta) maxDelta = delta;
      p.x = nextX;
      p.y = nextY;
      p.ra = alpha;
    }

    draw();

    // Halt as soon as the field stops moving, pointer or not. A motionless
    // cursor means the field has reached its lensed target and further paints
    // are identical, so the next `pointermove` re-arms the loop through
    // `wake()` — `raf` is 0 by then, so that guard cannot swallow it.
    if (fieldIsSettled(maxDelta)) {
      // Settled with no cursor is the definition of "home": nothing is left for
      // a gate to resume.
      if (!pointer) returnPending = false;
      raf = 0; // this chain ends here
      return;
    }
    schedule(interactiveTick);
  };

  // The `raf` test keeps pointer spam from cancelling and re-requesting a frame
  // that is already queued for the very same work. `!onscreen` is vestigial for
  // the same reason as in `interactiveTick`: `schedule()` would refuse anyway.
  const wake = () => {
    if (!interactive || !onscreen || condensing || raf) return;
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
    // With a cursor present the field tracks it rather than heading home.
    returnPending = false;
    wake();
  };

  const onPointerLeave = () => {
    pointer = null;
    returnPending = true; // outstanding until the loop reports it reached base
    wake(); // wake to run the damped return, which then halts itself
  };

  if (interactive && host) {
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
  }

  // Zero frames while the hero is offscreen (spec §5.1).
  const fieldObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible === onscreen) return;
      onscreen = visible;
      if (!onscreen) {
        cancel();
        return;
      }
      if (condensing) {
        schedule(tick);
      } else if (pointer || returnPending) {
        // A return interrupted by scrolling away still has to finish, or the
        // field holds a part-lensed frame until the next hover.
        wake();
      }
    },
    { rootMargin: "0px" }
  );
  fieldObserver.observe(canvas);

  const onVisibility = () => {
    if (document.hidden) {
      cancel();
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
    if (condensing) {
      schedule(tick);
    } else if (pointer || returnPending) {
      // A return interrupted by the tab going away still has to finish.
      wake();
    }
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
    returnPending = false;
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
    returnPending = false;
    resizePending = false;
    cancel();
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
