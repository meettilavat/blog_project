"use client";

import { useEffect, useRef } from "react";
import { sampleTitlePoints } from "@/lib/field/text-sampler";

const DRIFT_MS = 1200;
const CONDENSE_MS = 1600;
const PARTICLE_COUNT = 4000;

// Module-level play-once registry, keyed by title (spec §5.3).
const playedSlugs = new Set<string>();

export function __playedSlugs() {
  return playedSlugs;
}
export function __resetPlayedSlugs() {
  playedSlugs.clear();
}

// Dev-only frame counter for the §10 zero-frames-after-settle budget.
export const __frameCount = { value: 0 };

type Particle = { hx: number; hy: number; tx: number; ty: number; x: number; y: number };

function makeSeededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
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

    const targets = sampleTitlePoints({
      text: title,
      width,
      height,
      font: `700 ${Math.floor(height * 0.5)}px "Space Grotesk", sans-serif`,
      maxPoints: PARTICLE_COUNT,
      getContext: () => {
        const off = document.createElement("canvas");
        off.width = width;
        off.height = height;
        return off.getContext("2d");
      }
    });

    const rand = makeSeededRandom(0x9e3779b9);
    const targetCount = targets.length / 2;
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const hx = rand() * width;
      const hy = rand() * height;
      const has = i < targetCount;
      particles.push({
        hx, hy,
        tx: has ? targets[i * 2] : hx,
        ty: has ? targets[i * 2 + 1] : hy,
        x: hx, y: hy
      });
    }

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#F2A93B";
    let raf = 0;
    let start = 0;
    let running = true;

    const draw = () => {
      __frameCount.value++;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = accent;
      for (const p of particles) {
        ctx.globalAlpha = 0.9;
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

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
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
