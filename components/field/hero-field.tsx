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

// Dev-only frame counter for the §10 frame budget: no frames once the field has
// stopped moving — cursor present or not — and none at all while the hero is
// offscreen or the document is hidden.
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


  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // If this title already played, skip the condense and go straight to
  // settled — the field is then interactive without replaying its entrance.
  const alreadyPlayed = playedSlugs.has(title);

  const seed = hashString(title || "field");
  const targets = buildFieldTargets(width, height, seed);
  const rand = makeSeededRandom(seed ^ 0x9e3779b9);

  let minAlpha = Number.POSITIVE_INFINITY;
  let maxAlpha = Number.NEGATIVE_INFINITY;
  for (const t of targets) {
    if (t.a < minAlpha) minAlpha = t.a;
    if (t.a > maxAlpha) maxAlpha = t.a;
  }

  const particles: Particle[] = targets.map((t) => {
    const hx = rand() * width;
    const hy = rand() * height;
    return {
      hx,
      hy,
      tx: t.x,
      ty: t.y,
      x: hx,
      y: hy,
      a: t.a,
      ra: t.a,
      depth: particleDepth(t.a, minAlpha, maxAlpha)
    };
  });

  // A zero-size hero — `display: none`, a collapsed flex parent, a measurement
  // taken before layout — clamps to 1x1 and yields no targets. There is nothing
  // to animate, so bail before wiring anything up rather than spending a full
  // entrance painting an empty canvas.
  if (!particles.length) return () => {};

  let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#F2A93B";
  let raf = 0;
  let start = 0;
  let condensing = !alreadyPlayed;
  let onscreen = true;
  let pointer: { x: number; y: number; nx: number; ny: number } | null = null;

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
      if (pointer) wake();
    }
  };

  // ---- engaged (parallax + lensing, damped) ----
  const interactiveTick = () => {
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
      raf = 0; // this chain ends here
      return;
    }
    schedule(interactiveTick);
  };

  // The `raf` test keeps pointer spam from cancelling and re-requesting a frame
  // that is already queued for the very same work.
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
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    pointer = { x, y, nx: x / bounds.width, ny: y / bounds.height };
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
      } else if (pointer) {
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
    // A hero that mounted in a background tab still has its first frame
    // queued — a hidden document suspends rAF rather than dropping it, and no
    // visibilitychange fired on the way in to cancel it. Clear whatever is
    // queued before resuming, so `wake()` is not blocked by a handle that is
    // about to fire anyway.
    cancel();
    if (condensing) {
      schedule(tick);
    } else if (pointer) {
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

  return () => {
    condensing = false;
    pointer = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (host) {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    }
    document.removeEventListener("visibilitychange", onVisibility);
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
