"use client";

import { useEffect, useRef } from "react";

const DRIFT_MS = 1000;
const CONDENSE_MS = 1500;

// Module-level play-once registry, keyed by title (spec §5.3): the field
// condenses once per featured essay, then holds a static settled frame.
const playedSlugs = new Set<string>();

export function __playedSlugs() {
  return playedSlugs;
}
export function __resetPlayedSlugs() {
  playedSlugs.clear();
}

// Dev-only frame counter for the §10 zero-frames-after-settle budget.
export const __frameCount = { value: 0 };

type Particle = { hx: number; hy: number; tx: number; ty: number; x: number; y: number; a: number };

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

export default function HeroField({ title }: { title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // context failure: render nothing, headline is SSR'd beneath

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // If this title already played, render the settled frame once and stop.
    const alreadyPlayed = playedSlugs.has(title);

    const seed = hashString(title || "field");
    const targets = buildFieldTargets(width, height, seed);
    const rand = makeSeededRandom(seed ^ 0x9e3779b9);
    const particles: Particle[] = targets.map((t) => {
      const hx = rand() * width;
      const hy = rand() * height;
      return { hx, hy, tx: t.x, ty: t.y, x: hx, y: hy, a: t.a };
    });

    let accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#F2A93B";
    let raf = 0;
    let start = 0;
    let running = true;

    const draw = () => {
      __frameCount.value++;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = accent;
      for (const p of particles) {
        ctx.globalAlpha = p.a;
        ctx.fillRect(p.x, p.y, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    };

    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      if (!running) return;
      if (!start) start = now;
      const elapsed = now - start;
      if (elapsed < DRIFT_MS) {
        for (const p of particles) { p.x = p.hx; p.y = p.hy + Math.sin((now + p.hx) * 0.001) * 2; }
        draw();
        raf = requestAnimationFrame(tick);
      } else if (elapsed < DRIFT_MS + CONDENSE_MS) {
        const t = ease((elapsed - DRIFT_MS) / CONDENSE_MS);
        for (const p of particles) { p.x = p.hx + (p.tx - p.hx) * t; p.y = p.hy + (p.ty - p.hy) * t; }
        draw();
        raf = requestAnimationFrame(tick);
      } else {
        for (const p of particles) { p.x = p.tx; p.y = p.ty; }
        draw();
        playedSlugs.add(title);
        running = false; // loop halts on SETTLED
      }
    };

    if (alreadyPlayed) {
      for (const p of particles) { p.x = p.tx; p.y = p.ty; }
      draw();
      running = false;
    } else {
      raf = requestAnimationFrame(tick);
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (running) {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // One retint repaint on theme change (spec §5.5): re-read --accent when the
    // `dark` class flips; repaint once only if the loop has settled.
    const onThemeChange = () => {
      accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || accent;
      if (!running) draw();
    };
    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
    };
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
