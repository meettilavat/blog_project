import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import HeroField, {
  startField,
  __frameCount,
  __playedSlugs,
  __resetPlayedSlugs
} from "@/components/field/hero-field";
import { createFieldHarness, maxDrift } from "@/tests/support/field-harness";

const source = readFileSync(resolve(process.cwd(), "components/field/hero-field.tsx"), "utf8");

// An 800x400 hero: a pointer at (640, 200) sits 0.8 across and dead centre
// vertically, inside the field's dense right-hand mass.
const POINTER_X = 640;
const POINTER_Y = 200;

/** Frames the entrance needs at 16ms/frame to clear DRIFT_MS + CONDENSE_MS. */
const ENTRANCE_BUDGET = 600;

describe("HeroField", () => {
  beforeEach(() => __resetPlayedSlugs());
  afterEach(() => vi.unstubAllGlobals());

  it("renders an aria-hidden, non-interactive canvas", () => {
    const html = renderToStaticMarkup(<HeroField title="Tree Census" />);
    expect(html).toContain("<canvas");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('pointer-events');
  });

  it("registers the title once the entrance completes, and skips it on remount", () => {
    const first = createFieldHarness();
    const stopFirst = startField(first.canvas, "Tree Census");

    // The registry is the play-once gate, so it must not be set until the
    // entrance has actually finished.
    expect(__playedSlugs().has("Tree Census")).toBe(false);
    first.flush(ENTRANCE_BUDGET);
    expect(__playedSlugs().has("Tree Census")).toBe(true);
    expect(first.paintCount()).toBeGreaterThan(50);
    stopFirst();

    // Second mount for the same title goes straight to the settled frame:
    // one paint, no animation, no frames left pending.
    const second = createFieldHarness();
    const stopSecond = startField(second.canvas, "Tree Census");
    expect(second.paintCount()).toBe(1);
    expect(second.pending()).toBe(0);
    stopSecond();
  });

  it("watches only the class attribute and repaints once with the new accent", () => {
    const h = createFieldHarness({ accent: "#111111" });
    const stop = startField(h.canvas, "Theme");
    h.flush(ENTRANCE_BUDGET);

    expect(h.mutationObserver.target).toBe(h.documentElement);
    expect(h.mutationObserver.options).toEqual({ attributes: true, attributeFilter: ["class"] });
    expect(h.lastFrame().fillStyle).toBe("#111111");

    const painted = h.paintCount();
    h.setAccent("#222222");
    h.triggerMutation();

    expect(h.paintCount()).toBe(painted + 1); // exactly one repaint, not a loop
    expect(h.lastFrame().fillStyle).toBe("#222222"); // re-read from the variable
    expect(h.pending()).toBe(0);

    stop();
    expect(h.mutationObserver.disconnected).toBe(true);
  });

  it("stops scheduling frames once the entrance settles", () => {
    const h = createFieldHarness();
    const countBefore = __frameCount.value;
    const stop = startField(h.canvas, "Settle");

    expect(h.pending()).toBe(1); // exactly one frame in flight at mount
    expect(h.scaleApplied()).toEqual({ x: 2, y: 2 }); // dpr transform applied once
    expect(h.canvas.width).toBe(1600);

    const ran = h.flush(ENTRANCE_BUDGET);
    expect(ran).toBeLessThan(ENTRANCE_BUDGET); // the loop halted on its own
    expect(h.pending()).toBe(0); // the frame budget: zero frames when idle

    const painted = h.paintCount();
    expect(painted).toBeGreaterThan(50);
    expect(__frameCount.value - countBefore).toBe(painted);

    // Idle means idle: nothing runs and nothing paints without new input.
    expect(h.flush(200)).toBe(0);
    expect(h.paintCount()).toBe(painted);
    stop();
  });

  it("halts while the cursor sits still, holding its lensed target", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Parked");
    h.flush(ENTRANCE_BUDGET);
    const base = h.positions();
    const baseAlpha = h.maxAlpha();
    expect(h.pending()).toBe(0);

    h.movePointer(POINTER_X, POINTER_Y);
    expect(h.pending()).toBe(1); // the move woke the loop

    const ran = h.flush(1000);
    expect(ran).toBeGreaterThan(1);
    expect(ran).toBeLessThan(200); // converged instead of running forever
    expect(h.pending()).toBe(0); // a motionless cursor costs no frames
    expect(h.flush(500)).toBe(0); // and keeps costing none

    // It halted engaged rather than at base: brighter, and displaced.
    expect(h.maxAlpha()).toBeGreaterThan(baseAlpha);
    const drift = maxDrift(base, h.positions());
    expect(drift).toBeGreaterThan(1);
    // Bounded by parallax (12px) plus the lens cap (6px). The lens must read
    // each particle's settled target every frame — fed the animated position
    // instead, the pull compounds and the field collapses onto the cursor.
    expect(drift).toBeLessThan(22);
    stop();
  });

  it("returns to base after the pointer leaves, then stops", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Return");
    h.flush(ENTRANCE_BUDGET);
    const base = h.positions();
    const baseAlpha = h.maxAlpha();

    h.movePointer(POINTER_X, POINTER_Y);
    h.flush(1000);
    expect(maxDrift(base, h.positions())).toBeGreaterThan(1);

    h.leavePointer();
    expect(h.pending()).toBe(1); // the damped return starts from a halted loop

    const ran = h.flush(1000);
    expect(ran).toBeGreaterThan(1);
    expect(ran).toBeLessThan(200);
    expect(h.pending()).toBe(0); // the return terminates

    // Back at base within the settle epsilon's sub-pixel residual (0.05/0.14).
    expect(maxDrift(base, h.positions())).toBeLessThan(0.5);
    expect(h.maxAlpha()).toBeCloseTo(baseAlpha, 10);
    expect(h.flush(300)).toBe(0);
    stop();
  });

  it("runs and paints nothing while the hero is offscreen, and resumes on re-entry", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Offscreen");

    expect(h.intersectionObserver.targets).toContain(h.canvas);
    expect(h.pending()).toBe(1);
    h.flush(3); // part-way through the entrance
    const painted = h.paintCount();

    h.setIntersecting(false);
    expect(h.pending()).toBe(0); // the in-flight frame is cancelled
    expect(h.flush(200)).toBe(0); // nothing runs
    expect(h.paintCount()).toBe(painted); // nothing paints

    // Pointer movement over a scrolled-away hero must not wake it either.
    h.movePointer(POINTER_X, POINTER_Y);
    expect(h.pending()).toBe(0);
    expect(h.flush(200)).toBe(0);
    expect(h.paintCount()).toBe(painted);

    // Back in view: the entrance picks up and then settles as usual.
    h.setIntersecting(true);
    expect(h.pending()).toBe(1);
    expect(h.flush(ENTRANCE_BUDGET)).toBeGreaterThan(0);
    expect(h.paintCount()).toBeGreaterThan(painted);
    expect(h.pending()).toBe(0);

    stop();
    expect(h.intersectionObserver.disconnected).toBe(true);
  });

  it("attaches no pointer listeners on a coarse pointer, and behaves as it did before", () => {
    const h = createFieldHarness({ interactive: false });
    const stop = startField(h.canvas, "Coarse");

    expect(h.mediaQueries).toEqual(["(hover: hover) and (pointer: fine)"]);
    expect(h.host.listenerCount("pointermove")).toBe(0);
    expect(h.host.listenerCount("pointerleave")).toBe(0);

    // Exactly today's behaviour: condense once, then hold a static frame.
    const ran = h.flush(ENTRANCE_BUDGET);
    expect(ran).toBeLessThan(ENTRANCE_BUDGET);
    expect(h.pending()).toBe(0);
    const base = h.positions();
    const painted = h.paintCount();

    // Pointer input cannot reach the field at all: nothing moves, nothing paints.
    h.movePointer(POINTER_X, POINTER_Y);
    h.leavePointer();
    expect(h.pending()).toBe(0);
    expect(h.paintCount()).toBe(painted);
    expect(maxDrift(base, h.positions())).toBe(0);
    stop();
  });

  it("keeps one frame chain when a hidden mount becomes visible", () => {
    // A background-tab mount queues its first frame and never gets a
    // visibilitychange on the way in, so nothing cancelled it.
    const h = createFieldHarness({ hidden: true });
    const stop = startField(h.canvas, "Background");
    expect(h.pending()).toBe(1);

    h.setHidden(false);
    h.emitVisibilityChange();
    expect(h.pending()).toBe(1); // one chain, not two

    h.setHidden(true);
    h.emitVisibilityChange();
    expect(h.pending()).toBe(0); // hidden again: zero frames

    h.setHidden(false);
    h.emitVisibilityChange();
    expect(h.pending()).toBe(1); // and it can always be resumed
    expect(h.flush(ENTRANCE_BUDGET)).toBeGreaterThan(0);
    expect(h.pending()).toBe(0);
    stop();
  });

  it("removes every listener and disconnects both observers on teardown", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Teardown");

    expect(h.host.listenerCount("pointermove")).toBe(1);
    expect(h.host.listenerCount("pointerleave")).toBe(1);
    expect(h.documentListenerCount("visibilitychange")).toBe(1);
    expect(h.pending()).toBeGreaterThan(0); // a frame is in flight

    stop();

    expect(h.pending()).toBe(0);
    expect(h.host.listenerCount("pointermove")).toBe(0);
    expect(h.host.listenerCount("pointerleave")).toBe(0);
    expect(h.documentListenerCount("visibilitychange")).toBe(0);
    expect(h.intersectionObserver.disconnected).toBe(true);
    expect(h.mutationObserver.disconnected).toBe(true);

    // Nothing the platform does afterwards can paint again.
    const painted = h.paintCount();
    h.movePointer(POINTER_X, POINTER_Y);
    h.setIntersecting(true);
    h.emitVisibilityChange();
    h.triggerMutation();
    expect(h.flush(200)).toBe(0);
    expect(h.paintCount()).toBe(painted);
  });

  // The two facts with no behavioural expression, kept as source assertions:
  //
  // 1. Whether the motion arithmetic is imported or inlined is invisible at
  //    runtime, and the plan requires it to live in the shared, separately
  //    tested module.
  // 2. The lens must be fed each particle's settled target. Feeding it the
  //    animated position *and* using that as the target base compounds into a
  //    collapse — which "halts while the cursor sits still" and "returns to
  //    base" both catch. Changing only the lens's base arguments is bounded by
  //    the 6px pull cap and so has no observable effect, but it is one edit away
  //    from the collapsing form, so the intended call is pinned here.
  it("uses the shared motion math rather than inlining the arithmetic", () => {
    expect(source).toContain('from "@/lib/field/field-motion"');
    expect(source).toContain("lensInfluence(p.tx, p.ty,");
  });
});
