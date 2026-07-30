import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import HeroField, {
  RESIZE_DEBOUNCE_MS,
  startField,
  __frameCount,
  __playedSlugs,
  __resetPlayedSlugs
} from "@/components/field/hero-field";
import {
  COMBINED_PULL_CAP_PX,
  DAMPING,
  LENS_ALPHA_CAP,
  LENS_ALPHA_GAIN,
  LENS_RADIUS_PX,
  SETTLE_EPSILON_PX,
  TRANSIT_FIRST_DELAY_MS,
  TRANSIT_MAX_GAP_MS,
  TRANSIT_MIN_GAP_MS
} from "@/lib/field/field-motion";
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
    // Precisely none: `pointer-events-auto` would satisfy a looser match, and
    // the canvas swallowing events would break the headline link's hover/focus.
    expect(html).toContain("pointer-events-none");
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

  it("finishes an interrupted return after the document comes back", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Interrupted by hiding");
    h.flush(ENTRANCE_BUDGET);
    const base = h.positions();

    h.movePointer(POINTER_X, POINTER_Y);
    h.flush(1000);
    expect(maxDrift(base, h.positions())).toBeGreaterThan(1);

    h.leavePointer();
    h.flush(2); // return in flight, nowhere near home
    expect(maxDrift(base, h.positions())).toBeGreaterThan(0.5);

    h.setHidden(true);
    h.emitVisibilityChange();
    expect(h.pending()).toBe(0); // nothing runs while hidden

    h.setHidden(false);
    h.emitVisibilityChange();
    // The cursor is long gone, but the field is still off base: the return has
    // to be picked back up rather than abandoned until the next hover.
    expect(h.pending()).toBe(1);

    const ran = h.flush(1000);
    expect(ran).toBeGreaterThan(1);
    expect(h.pending()).toBe(0); // and it halts once home
    expect(maxDrift(base, h.positions())).toBeLessThan(0.5);

    // Nothing outstanding now, so a further resume must stay free.
    h.setHidden(true);
    h.emitVisibilityChange();
    h.setHidden(false);
    h.emitVisibilityChange();
    expect(h.pending()).toBe(0);
    stop();
  });

  it("finishes an interrupted return after the hero scrolls back into view", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Interrupted by scrolling");
    h.flush(ENTRANCE_BUDGET);
    const base = h.positions();

    h.movePointer(POINTER_X, POINTER_Y);
    h.flush(1000);
    h.leavePointer();
    h.flush(2);
    expect(maxDrift(base, h.positions())).toBeGreaterThan(0.5);

    h.setIntersecting(false);
    expect(h.pending()).toBe(0);

    h.setIntersecting(true);
    expect(h.pending()).toBe(1);
    expect(h.flush(1000)).toBeGreaterThan(1);
    expect(h.pending()).toBe(0);
    expect(maxDrift(base, h.positions())).toBeLessThan(0.5);

    // At rest again: leaving and re-entering the viewport costs no frames.
    h.setIntersecting(false);
    h.setIntersecting(true);
    expect(h.pending()).toBe(0);
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

  it("schedules nothing while offscreen, even across a visibility change", () => {
    // A hero below the fold has its optimistic first frame cancelled by the
    // observer's opening report, and then sits condensing-but-offscreen.
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Offscreen visibility");
    h.setIntersecting(false);
    expect(h.pending()).toBe(0);

    h.setHidden(true);
    h.emitVisibilityChange();
    h.setHidden(false);
    h.emitVisibilityChange();

    // Becoming visible must not schedule for a hero that is still scrolled
    // away: that frame would run, paint nothing, and leave a dead handle.
    expect(h.pending()).toBe(0);
    const painted = h.paintCount();
    expect(h.flush(200)).toBe(0);
    expect(h.paintCount()).toBe(painted);

    // Re-entry then leaves exactly one chain, not one per missed resume.
    h.setIntersecting(true);
    expect(h.pending()).toBe(1);
    expect(h.flush(ENTRANCE_BUDGET)).toBeGreaterThan(0);
    expect(h.pending()).toBe(0);
    stop();
  });

  it("coalesces pointer spam onto the frame already queued", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Spam");
    h.flush(ENTRANCE_BUDGET);
    expect(h.pending()).toBe(0);

    h.movePointer(POINTER_X, POINTER_Y);
    expect(h.pending()).toBe(1);
    const queued = h.pendingIds();

    // A second move before that frame runs must ride it rather than cancelling
    // and re-requesting identical work — `wake()`'s `raf` test is what does it.
    h.movePointer(POINTER_X + 4, POINTER_Y + 4);
    expect(h.pending()).toBe(1);
    expect(h.pendingIds()).toEqual(queued);
    stop();
  });

  it("hands the lens to a cursor that arrived during the entrance", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Arrived");
    h.flush(3); // entrance under way
    const entranceFrame = h.pendingIds();

    h.movePointer(POINTER_X, POINTER_Y); // cursor arrives, then holds still
    // Still the entrance's own frame — the same handle, not a replacement.
    expect(h.pendingIds()).toEqual(entranceFrame);

    const ran = h.flush(ENTRANCE_BUDGET);
    expect(ran).toBeLessThan(ENTRANCE_BUDGET);
    expect(h.pending()).toBe(0); // engaged, then halted

    // The frame it settled on is lensed: a cursor already inside the hero does
    // not have to move again to be noticed.
    const engagedAlpha = h.maxAlpha();
    h.leavePointer();
    h.flush(1000);
    expect(h.maxAlpha()).toBeLessThan(engagedAlpha);
    stop();
  });

  it("arms no return for a cursor that left during the entrance", () => {
    const h = createFieldHarness();
    const stop = startField(h.canvas, "Left mid-entrance");
    h.flush(3); // entrance under way

    // The cursor arrives and leaves again before the entrance finishes, so the
    // return it asks for is declined — `wake()` refuses while condensing — and
    // the entrance then snaps every particle to base on its own.
    h.movePointer(POINTER_X, POINTER_Y);
    h.leavePointer();
    expect(h.flush(ENTRANCE_BUDGET)).toBeLessThan(ENTRANCE_BUDGET);
    expect(h.pending()).toBe(0);

    const base = h.positions();
    const painted = h.paintCount();

    // Nothing is outstanding: the field is at base with no cursor. A resume must
    // therefore cost nothing, rather than spend a frame rediscovering that and
    // repainting an identical field.
    h.setHidden(true);
    h.emitVisibilityChange();
    h.setHidden(false);
    h.emitVisibilityChange();
    expect(h.pending()).toBe(0);

    // Same for the other gate, which reads the same flag.
    h.setIntersecting(false);
    h.setIntersecting(true);
    expect(h.pending()).toBe(0);

    // Neither gate painted, and the field is still exactly where it settled — so
    // the zero above is "nothing to do", not "the field was left part-lensed".
    expect(h.paintCount()).toBe(painted);
    expect(maxDrift(base, h.positions())).toBe(0);
    stop();
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

    // Force a fresh paint so the positions are newly recorded rather than the
    // same frame compared against itself: the particles must still be at base.
    h.triggerMutation();
    expect(h.paintCount()).toBe(painted + 1);
    expect(maxDrift(base, h.positions())).toBe(0);
    stop();
  });

  it("does nothing at all for a zero-size hero", () => {
    // A collapsed or not-yet-laid-out hero clamps to 1x1 and produces no
    // targets. Running the entrance over an empty particle list would burn a
    // full entrance's worth of frames painting nothing.
    const h = createFieldHarness({ width: 0, height: 0 });
    const stop = startField(h.canvas, "Collapsed");

    expect(h.pending()).toBe(0);
    expect(h.paintCount()).toBe(0);
    expect(h.host.listenerCount("pointermove")).toBe(0);
    expect(h.host.listenerCount("pointerleave")).toBe(0);
    expect(h.documentListenerCount("visibilitychange")).toBe(0);
    expect(h.intersectionObserver.callback).toBeNull();
    expect(h.mutationObserver.callback).toBeNull();
    // Including the ResizeObserver. `startField` documents that this bail is what
    // makes a zero-size hero unable to recover once it gains a box; wiring the
    // observer above the bail would quietly make that comment wrong, and no other
    // test would notice.
    expect(h.resizeObserver.callback).toBeNull();

    stop(); // the teardown it hands back must still be safe to call
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

  it("removes every listener and disconnects all three observers on teardown", () => {
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
    expect(h.resizeObserver.disconnected).toBe(true);

    // Nothing the platform does afterwards can paint again.
    const painted = h.paintCount();
    h.movePointer(POINTER_X, POINTER_Y);
    h.setIntersecting(true);
    h.emitVisibilityChange();
    h.triggerMutation();
    // The resize entry point too, so the sweep covers all four rather than three
    // — but it is a weak probe, and deliberately so: `triggerResize` short-circuits
    // on the harness's own disconnected flag and never reaches the field's
    // callback, so the `resizeObserver.disconnected` assertion above is what
    // actually carries this half.
    h.triggerResize();
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
  // 3. Arity, which became a hazard when `lensInfluence` lost its `alpha`
  //    parameter and `radius` moved into the 5th slot. Both are `number`, so a
  //    stray `p.a` left in that position typechecks cleanly — verified, exit 0 —
  //    and is read as a 0.66px lens radius. Only behaviour catches it, and what
  //    fails is three geometry tests whose names point at coordinate space rather
  //    than at the call. Pinning the closing paren is what makes the failure name
  //    the real culprit, so the literal must stay whole rather than stopping at a
  //    comma.
  it("uses the shared motion math rather than inlining the arithmetic", () => {
    expect(source).toContain('from "@/lib/field/field-motion"');
    expect(source).toContain("lensInfluence(p.tx, p.ty, pointer.x, pointer.y)");
  });

  // Nested inside `HeroField` for the same reason as the block below: the
  // `afterEach` above is what unstubs the globals each harness installs.
  describe("startField coordinate space", () => {
    it("maps the pointer into field space when the element has been relaid out", () => {
      // The Safari case: the hero measured 800x400 at mount, then a webfont swap
      // relaid the headline and the box became 400x200 with no notification. The
      // canvas is CSS-sized to fill, so the browser stretches the old bitmap over
      // the new box — and the pointer must be mapped into field space rather than
      // compared raw against particle coordinates that live in the old one.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "coordinate space");
      harness.flush(400);
      expect(harness.pending()).toBe(0);

      const settled = harness.lastFrame().dots.map((dot) => ({ ...dot }));
      harness.setSize(400, 200); // no triggerResize: the field does not know

      // Mapped into the 800x400 field space this is (760, 360). Off-centre on
      // purpose: both axes are then displaced by more than the lens radius, so a
      // mapping applied to only one of them is caught too. At the element's
      // centre the vertical error would be 100px — inside the radius, invisible.
      harness.movePointer(380, 180);
      harness.flush(1);

      const after = harness.lastFrame().dots;
      const brightened = after
        .map((dot, index) => ({
          x: settled[index].x,
          y: settled[index].y,
          gain: dot.alpha - settled[index].alpha
        }))
        .filter((dot) => dot.gain > 1e-6);

      // This loop is what carries the test. Drop the scale factors and dots still
      // brighten — raw (380, 180) is nx = 0.475 in the 800x400 field space, where
      // the horizontal density mask is about 0.26 rather than the zero it clamps
      // to further left, so there is field to light up — they are just the wrong
      // dots: the failure is `expected 480.39 to be less than 131`, a lens centred
      // half the hero away from the mapped point.
      for (const dot of brightened) {
        expect(Math.hypot(dot.x - 760, dot.y - 360)).toBeLessThan(LENS_RADIUS_PX + 1);
      }
      // The guard that keeps the loop from passing over an empty array — which is
      // how it would pass if the lens stopped reaching any dot at all.
      expect(brightened.length).toBeGreaterThan(0);

      // `nx`/`ny` are field-space too. Normalising the mapped `x` by `bounds.width`
      // instead would put them at 1.9 and 1.8 — `parallaxOffset` has no clamp, so
      // the field would slide ~45px instead of the ~14 the 12px parallax and 6px
      // lens cap allow at this pointer. Nothing above notices: the lens reads
      // `p.tx`/`p.ty`, so only displacement can catch it.
      harness.flush(1000);
      expect(maxDrift(settled, harness.positions())).toBeLessThan(24);
      stop();
    });

    it("rebuilds on a debounced resize and repaints exactly once", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize rebuild");
      harness.flush(400);
      // The observer has to be watching the canvas, not merely constructed: the
      // harness hands `triggerResize()` the callback from the constructor, so an
      // observer that never called `observe` would satisfy everything below.
      expect(harness.resizeObserver.targets).toContain(harness.canvas);
      const paintsAtRest = harness.paintCount();

      harness.setSize(600, 300);
      harness.triggerResize();
      // Nothing happens until the debounce elapses.
      expect(harness.paintCount()).toBe(paintsAtRest);

      harness.advanceClock(RESIZE_DEBOUNCE_MS);
      expect(harness.paintCount()).toBe(paintsAtRest + 1);
      // A rebuild is a snap, not an animation: no frames are left queued.
      expect(harness.pending()).toBe(0);
      stop();
    });

    it("repaints on a rebuild even when a frame was already queued", () => {
      // `measure()` reassigns `canvas.width`, which clears the bitmap, so the
      // repaint at the end of `applyResize` is the only thing that refills it.
      // Skipping it because a frame happens to be in flight strands the hero
      // blank: that frame is not a substitute, because the intersection gate
      // cancels it the moment the hero scrolls away, and on the way back in there
      // is nothing to resume — `applyResize` cleared `pointer` and `returnPending`
      // itself, which is precisely what both gates test before scheduling. The
      // hero then holds a cleared bitmap until the next pointermove, theme flip,
      // or resize.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize with a frame queued");
      harness.flush(ENTRANCE_BUDGET);
      expect(harness.pending()).toBe(0);
      const paintsAtRest = harness.paintCount();

      // A cursor arrives and the frame it wakes is deliberately left unrun —
      // `advanceClock` moves time without running frames, which is the state a
      // busy main thread puts the real field in whenever a frame is still queued
      // as the debounce comes due.
      harness.movePointer(POINTER_X, POINTER_Y);
      expect(harness.pending()).toBe(1);

      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      // Out of view and back again: the queued frame is gone and neither gate
      // finds anything outstanding to schedule, so the rebuild's own repaint is
      // the only one the hero will ever get.
      harness.setIntersecting(false);
      harness.setIntersecting(true);
      expect(harness.pending()).toBe(0);

      expect(harness.paintCount()).toBeGreaterThan(paintsAtRest);
      // And it painted the rebuilt field rather than leaving the stale one as the
      // last word: the 800-wide space put dots past 600.
      for (const dot of harness.lastFrame().dots) {
        expect(dot.x).toBeLessThanOrEqual(600);
        expect(dot.y).toBeLessThanOrEqual(300);
      }
      stop();
    });

    it("coalesces a burst of resize notifications into one rebuild", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize coalesce");
      harness.flush(400);
      const paintsAtRest = harness.paintCount();

      for (const size of [700, 600, 500, 400]) {
        harness.setSize(size, 300);
        harness.triggerResize();
        harness.advanceClock(Math.floor(RESIZE_DEBOUNCE_MS / 2)); // each re-arms the timer
      }
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      expect(harness.paintCount()).toBe(paintsAtRest + 1);
      // And the one rebuild is a snap, same as the single-notification case: a
      // burst that ended up scheduling a frame would satisfy the count above.
      expect(harness.pending()).toBe(0);
      stop();
    });

    it("ignores a resize that does not change the integer size", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize subpixel");
      harness.flush(400);
      const paintsAtRest = harness.paintCount();

      harness.setSize(800.4, 400.2); // sub-pixel churn from a scrollbar settling
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS * 2); // well past the debounce

      expect(harness.paintCount()).toBe(paintsAtRest);
      stop();
    });

    it("resizes the backing buffer and reapplies the dpr transform", () => {
      const harness = createFieldHarness({ width: 800, height: 400, devicePixelRatio: 2 });
      const stop = startField(harness.canvas, "resize buffer");
      harness.flush(400);
      expect(harness.canvas.width).toBe(1600);

      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      expect(harness.canvas.width).toBe(1200);
      expect(harness.canvas.height).toBe(600);
      // The dpr itself, not a value derived from it: the field draws in CSS
      // pixels and the transform is what stretches that over the buffer. The
      // harness composes `scale()` calls the way the real API does — it never
      // resets the transform on its own — so this is the assertion that catches a
      // rebuild which rescales without resetting first: the mount's 2x and the
      // rebuild's 2x would compound and this would read { x: 4, y: 4 }.
      expect(harness.scaleApplied()).toEqual({ x: 2, y: 2 });
      stop();
    });

    it("re-reads the device pixel ratio when it rebuilds", () => {
      // Dragging the window onto a non-Retina display changes `devicePixelRatio`
      // and reflows the hero, so the rebuild has to take the ratio from the
      // platform again. A `dpr` captured once at mount would size the buffer 1200
      // and keep scaling by 2, painting the field at double size.
      const harness = createFieldHarness({ width: 800, height: 400, devicePixelRatio: 2 });
      const stop = startField(harness.canvas, "resize dpr");
      harness.flush(400);

      Object.assign(window, { devicePixelRatio: 1 });
      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      expect(harness.canvas.width).toBe(600);
      expect(harness.canvas.height).toBe(300);
      expect(harness.scaleApplied()).toEqual({ x: 1, y: 1 });
      stop();
    });

    it("produces an identical field when rebuilt at the same size", () => {
      // A rebuild derives the field from the box and the title seed alone, so
      // returning to a size returns to that size's exact field. Anything that
      // accumulated across rebuilds — appending to `particles` rather than
      // replacing it, or a seed advanced once per call — shows up here.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize determinism");
      harness.flush(400);
      const first = harness.positions();

      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      harness.setSize(800, 400);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      expect(harness.positions()).toEqual(first);
      stop();
    });

    it("lets the entrance finish, then rebuilds, when a resize lands mid-condense", () => {
      // Every font in the public app loads `display: "swap"`, so a cold load
      // relayouts the text-balance headline a few hundred ms in and this fires
      // inside the 2.5s entrance. Rebuilding on the spot would truncate the
      // condense for most first-time visitors, so it is deferred to the end.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize during entrance");
      harness.flush(10); // still condensing
      expect(harness.pending()).toBe(1);

      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      // The entrance is untouched: still animating, and the buffer still carries
      // the size it was measured at. Snapping here is what this must not do.
      expect(harness.pending()).toBe(1);
      expect(harness.canvas.width).toBe(1600);

      const ran = harness.flush(ENTRANCE_BUDGET);
      expect(ran).toBeLessThan(ENTRANCE_BUDGET); // it halted on its own
      expect(harness.pending()).toBe(0);

      // Landing rebuilt the field in the new space: 600x300 at dpr 2.
      expect(harness.canvas.width).toBe(1200);
      expect(harness.canvas.height).toBe(600);
      // And no dot sits outside the smaller box, which a stretched stale field
      // would — the old buffer's dots ran to 800 wide.
      for (const dot of harness.lastFrame().dots) {
        expect(dot.x).toBeLessThanOrEqual(600);
        expect(dot.y).toBeLessThanOrEqual(300);
      }
      stop();
    });

    it("keeps a cursor that arrived mid-entrance when the box ends up unchanged", () => {
      // The re-check on landing is not observable through the buffer — measuring
      // an unchanged box produces an identical one — but it is observable through
      // the cursor. A rebuild drops the stored pointer because its coordinates
      // belong to the old space; when the box ends up where it started, those
      // coordinates are still valid and discarding them costs the visitor the
      // lens until they move the mouse again.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize reverted during entrance");
      harness.flush(10);

      // Arrives during the entrance, so `wake()` declines and it is merely stored.
      harness.movePointer(POINTER_X, POINTER_Y);

      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);
      // Dragged back to where it started before the entrance finished.
      harness.setSize(800, 400);
      harness.triggerResize();
      harness.advanceClock(RESIZE_DEBOUNCE_MS);

      harness.flush(ENTRANCE_BUDGET);
      expect(harness.canvas.width).toBe(1600);
      expect(harness.canvas.height).toBe(800);

      // The entrance hands the waiting cursor its lens rather than making it move
      // again to be noticed, so the field settles brighter than it would at rest.
      // Asserting on `pending()` here would not work: this flush has budget left
      // over and drains the lens animation too, ending at zero either way.
      const lensed = harness.maxAlpha();
      harness.leavePointer();
      harness.flush(1000);
      // An unconditional rebuild would have dropped the pointer, so `lensed`
      // would already have been the resting peak and these would be equal.
      expect(lensed).toBeGreaterThan(harness.maxAlpha());
      stop();
    });

    it("disconnects the ResizeObserver on teardown", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize teardown");
      harness.flush(400);
      expect(harness.resizeObserver.disconnected).toBe(false);
      stop();
      expect(harness.resizeObserver.disconnected).toBe(true);
    });

    it("cancels a pending resize debounce on teardown", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize teardown timer");
      harness.flush(400);
      harness.setSize(600, 300);
      harness.triggerResize();
      stop();
      const paintsAfterStop = harness.paintCount();
      harness.advanceClock(500);
      expect(harness.paintCount()).toBe(paintsAfterStop);
    });
  });

  // Nested inside `HeroField` for the same reason as the blocks around it: the
  // `afterEach` above is what unstubs the globals each harness installs.
  describe("startField alpha composition", () => {
    it("paints an unlensed particle at exactly its base alpha", () => {
      // The refactor routes every particle through composeAlpha, including those
      // with no influence at all. min(cap, a * 1) must be indistinguishable from a.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "alpha identity");
      harness.flush(400);
      const settled = harness.lastFrame().dots.map((dot) => dot.alpha);

      const paintedAtRest = harness.paintCount();
      harness.movePointer(10, 10); // far corner, clear of most of the field
      harness.flush(60);
      const after = harness.lastFrame().dots;

      // Without this the test cannot fail if the cursor never took effect at all:
      // `after` would be the very frame `settled` was read from and every equality
      // below would hold trivially. Neutering `wake()` is enough to reach that.
      // Paint count is the right probe rather than "some dot brightened" — at
      // (10, 10) the density mask is zero, so by design nothing here brightens.
      expect(harness.paintCount()).toBeGreaterThan(paintedAtRest);

      // Dots beyond the lens radius of the pointer are untouched to the bit.
      const untouched = after.filter(
        (dot) => Math.hypot(dot.x - 10, dot.y - 10) > LENS_RADIUS_PX * 2
      );
      expect(untouched.length).toBeGreaterThan(0);
      for (const dot of untouched) {
        const index = after.indexOf(dot);
        expect(dot.alpha).toBe(settled[index]);
      }
      stop();
    });

    it("brightens by no more than the lens gain allows", () => {
      // LENS_ALPHA_GAIN moved out of `lensInfluence` and into the frame loop in
      // this refactor, which left it pinned by nothing: every other brightening
      // assertion is either an inequality or a `<= LENS_ALPHA_CAP` bound that the
      // ceiling's own `Math.min` absorbs. Dropping the constant — brightening by
      // the full weight instead of 55% of it — kept all 78 tests green.
      //
      // A proportional bound is what catches it, and it has to skip capped dots:
      // once `Math.min` clips a dot to the ceiling both the correct and the
      // inflated gain report the same ratio, so a capped dot proves nothing.
      //
      // Which is also why the cursor goes to (460, 80) rather than the usual
      // POINTER_X/POINTER_Y. Inside the dense right-hand mass the dots are bright
      // — base alpha up to the 0.66 ceiling `buildFieldTargets` imposes — and a
      // dot needs base alpha below 0.548 for an inflated gain to stay under 0.85
      // and therefore stay visible. At (640, 200) every dot near enough to carry
      // real weight clips first, and the inflated version passes. At (460, 80),
      // near the mask's falloff, 85 dots break the bound; the worst sits at base
      // alpha 0.41 with weight 1.0, giving 0.55 correct against 1.00 inflated.
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "alpha gain");
      harness.flush(ENTRANCE_BUDGET);
      const settled = harness.lastFrame().dots.map((dot) => dot.alpha);

      harness.movePointer(460, 80);
      harness.flush(200);
      const after = harness.lastFrame().dots;

      let checked = 0;
      for (let i = 0; i < after.length; i++) {
        if (after[i].alpha >= LENS_ALPHA_CAP - 1e-9) continue; // clipped, uninformative
        const ratio = after[i].alpha / settled[i] - 1;
        expect(ratio).toBeLessThanOrEqual(LENS_ALPHA_GAIN + 1e-9);
        if (ratio > 1e-6) checked++;
      }
      // Guard against the loop having nothing to say: some uncapped dot must
      // actually have brightened, or the bound above never ran on a real gain.
      expect(checked).toBeGreaterThan(0);
      stop();
    });

    it("never exceeds the alpha ceiling with the cursor at rest on the field", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "alpha ceiling");
      harness.flush(400);
      harness.movePointer(600, 150); // inside the dense right-hand mass
      harness.flush(120);
      expect(harness.maxAlpha()).toBeLessThanOrEqual(LENS_ALPHA_CAP);
      stop();
    });
  });

  // Nested inside `HeroField` for the same reason as the blocks around it: the
  // `afterEach` above is what unstubs the globals each harness installs.
  describe("startField transit", () => {
    const settle = (harness: ReturnType<typeof createFieldHarness>) => {
      harness.flush(400);
      expect(harness.pending()).toBe(0);
    };

    it("runs no frames while waiting for the first transit", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit idle");
      settle(harness);
      const paintsAtRest = harness.paintCount();

      // Just short of the armed delay: the timer is set but has not fired.
      harness.advanceClock(TRANSIT_FIRST_DELAY_MS - 1);
      expect(harness.pending()).toBe(0);
      expect(harness.paintCount()).toBe(paintsAtRest);
      stop();
    });

    it("arms and renders a first transit after the entrance", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit first");
      settle(harness);
      const settledPeak = harness.maxAlpha();

      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      expect(harness.pending()).toBe(1);

      // Mid-sweep the field is brighter than at rest.
      harness.flush(45);
      expect(harness.maxAlpha()).toBeGreaterThan(settledPeak);

      // And it finishes and halts on its own.
      const ran = harness.flush(400);
      expect(ran).toBeLessThan(400);
      expect(harness.pending()).toBe(0);
      stop();
    });

    it("paints a full sweep rather than halting on the first zero-weight frame", () => {
      // The load-bearing regression: a transit's opening frames have zero weight
      // everywhere, because the front starts a full band outside the field. If the
      // halt test does not also require "no transit in flight", the field reads as
      // settled and the chain ends before the front reaches any dot.
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit full sweep");
      settle(harness);
      const paintsAtRest = harness.paintCount();

      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      harness.flush(400);

      // TRANSIT_MS / 16ms per frame is ~94 frames, plus the damped relax behind
      // the front. A halt-on-first-frame bug yields single digits.
      expect(harness.paintCount() - paintsAtRest).toBeGreaterThan(80);
      stop();
    });

    it("keeps the chain alive through the very first transit frame", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit first frame");
      settle(harness);
      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      harness.flush(1);
      expect(harness.pending()).toBe(1);
      stop();
    });

    it("re-arms with a gap no shorter than the minimum", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit rearm");
      settle(harness);
      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      harness.flush(400);
      expect(harness.pending()).toBe(0);
      const paintsAfterFirst = harness.paintCount();

      // A gap shorter than the minimum fires nothing.
      harness.advanceClock(TRANSIT_MIN_GAP_MS - 1);
      expect(harness.pending()).toBe(0);
      expect(harness.paintCount()).toBe(paintsAfterFirst);

      // Past the maximum, one has definitely fired.
      harness.advanceClock(TRANSIT_MAX_GAP_MS);
      expect(harness.pending()).toBe(1);
      stop();
    });

    it("returns the field to base alpha after a transit passes", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit relax");
      settle(harness);
      const settledDots = harness.lastFrame().dots.map((dot) => ({ ...dot }));

      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      harness.flush(400);

      // Alpha comes back exactly: with no influence left, `composeAlpha(a, 0)` is
      // `min(cap, a)`, and every base alpha is below the cap.
      //
      // Positions come back only within the settle epsilon. The halt test bounds
      // each axis's per-frame step to SETTLE_EPSILON_PX, so a dot can stop up to
      // SETTLE_EPSILON_PX / DAMPING short of its target — measured worst here is
      // 0.30px. That is not slack: mid-sweep the same dots sit 3.1px off base, so
      // a transit that failed to release them misses this by an order of
      // magnitude.
      const residual = SETTLE_EPSILON_PX / DAMPING;
      const after = harness.lastFrame().dots;
      for (let i = 0; i < after.length; i++) {
        expect(after[i].alpha).toBeCloseTo(settledDots[i].alpha, 10);
        expect(Math.abs(after[i].x - settledDots[i].x)).toBeLessThan(residual);
        expect(Math.abs(after[i].y - settledDots[i].y)).toBeLessThan(residual);
      }
      stop();
    });

    it("holds the combined displacement cap with a cursor parked on the sweep", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "transit plus lens");
      settle(harness);
      const base = harness.lastFrame().dots.map((dot) => ({ ...dot }));

      // On the field's vertical midline, and held still. `ny` is then exactly 0.5,
      // so `parallaxOffset` returns exactly 0 on the y axis and a dot's vertical
      // displacement from base *is* its capped vertical pull, with no parallax to
      // allow for. x is left in the dense right-hand mass, where there are bright
      // dots within lens range above and below the cursor.
      harness.movePointer(600, 200);
      harness.flush(120);
      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);

      // The y axis is also where the two influences add rather than fight: the
      // transit travels up (uy = -0.809, the larger of its two components) and a
      // dot below the cursor is pulled up toward it. For a dot ~55px below, the
      // lens is at its own 6px cap and the sweep adds 4.45 more.
      //
      // This is the only assertion that pins COMBINED_PULL_CAP_PX at all, so its
      // margins are worth recording: the worst vertical displacement is 7.51px
      // with the cap and 8.51px without it. Bounding the Euclidean drift instead
      // would have no teeth — the field's extremes are parallax-dominated, and
      // there both numbers are 12.00px to twelve decimal places.
      let worstY = 0;
      for (let step = 0; step < 400; step++) {
        if (harness.flush(1) === 0) break;
        const dots = harness.lastFrame().dots;
        for (let i = 0; i < dots.length; i++) {
          worstY = Math.max(worstY, Math.abs(dots[i].y - base[i].y));
        }
        expect(harness.maxAlpha()).toBeLessThanOrEqual(LENS_ALPHA_CAP);
      }
      expect(worstY).toBeLessThanOrEqual(COMBINED_PULL_CAP_PX);
      stop();
    });

    it("runs transits on a touch device, where there is no cursor to rely on", () => {
      // Without this, a phone gets a single entrance and then a frozen field
      // forever, which is the complaint this feature exists to answer.
      const harness = createFieldHarness({ interactive: false });
      const stop = startField(harness.canvas, "transit touch");
      settle(harness);
      expect(harness.host.listenerCount("pointermove")).toBe(0);
      const paintsAtRest = harness.paintCount();

      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      expect(harness.pending()).toBe(1);
      harness.flush(400);
      expect(harness.paintCount() - paintsAtRest).toBeGreaterThan(80);
      stop();
    });

    it("drops a transit that comes due while the hero is offscreen", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit offscreen");
      settle(harness);
      expect(harness.pendingTimers()).toBe(1); // the armed first delay
      harness.setIntersecting(false);
      const paintsOffscreen = harness.paintCount();

      // Disarmed, not merely ignored. The two assertions below cannot tell the
      // difference on their own — `wake()` refuses while offscreen, so a timer
      // left running fires, schedules nothing, and looks identical from here. What
      // it leaves behind is `transitPending` raised, and nothing ever lowers it:
      // the next wake for any reason at all, a hover or a gate resuming an
      // outstanding return, then opens a transit on the spot rather than at the
      // end of a gap.
      expect(harness.pendingTimers()).toBe(0);

      // Long enough for several transits to have come due.
      harness.advanceClock(TRANSIT_FIRST_DELAY_MS + TRANSIT_MAX_GAP_MS * 3);
      expect(harness.pending()).toBe(0);
      expect(harness.paintCount()).toBe(paintsOffscreen);

      // Coming back does not fire a backlog — it arms a fresh gap.
      harness.setIntersecting(true);
      expect(harness.pending()).toBe(0);
      harness.advanceClock(TRANSIT_MAX_GAP_MS);
      expect(harness.pending()).toBe(1);
      stop();
    });

    it("drops a transit that comes due while the tab is hidden", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit hidden");
      settle(harness);
      expect(harness.pendingTimers()).toBe(1);
      harness.setHidden(true);
      harness.emitVisibilityChange();
      const paintsHidden = harness.paintCount();

      // Disarmed for the same reason as the offscreen gate above — and here it is
      // load-bearing on its own: `wake()` does not test `document.hidden`, so a
      // surviving timer would schedule a frame in a background tab and rely
      // entirely on the engine to suspend it.
      expect(harness.pendingTimers()).toBe(0);

      harness.advanceClock(TRANSIT_FIRST_DELAY_MS + TRANSIT_MAX_GAP_MS * 3);
      expect(harness.pending()).toBe(0);
      expect(harness.paintCount()).toBe(paintsHidden);

      harness.setHidden(false);
      harness.emitVisibilityChange();
      expect(harness.pending()).toBe(0);
      harness.advanceClock(TRANSIT_MAX_GAP_MS);
      expect(harness.pending()).toBe(1);
      stop();
    });

    it("walks the field home after a transit is abandoned mid-sweep", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit abandoned");
      settle(harness);
      const settledDots = harness.lastFrame().dots.map((dot) => ({ ...dot }));

      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      harness.flush(45); // mid-sweep, dots displaced
      expect(harness.positions()).not.toEqual(
        settledDots.map((dot) => ({ x: dot.x, y: dot.y }))
      );

      harness.setIntersecting(false);
      expect(harness.pending()).toBe(0);
      harness.setIntersecting(true);
      // The interrupted return is outstanding, so the gate resumes it.
      expect(harness.pending()).toBe(1);
      harness.flush(200);

      // Home to within the settle epsilon, as in "returns the field to base alpha"
      // above — the dots were 3px off when the sweep was cut short.
      const residual = SETTLE_EPSILON_PX / DAMPING;
      const after = harness.lastFrame().dots;
      for (let i = 0; i < after.length; i++) {
        expect(Math.abs(after[i].x - settledDots[i].x)).toBeLessThan(residual);
        expect(Math.abs(after[i].y - settledDots[i].y)).toBeLessThan(residual);
      }
      stop();
    });

    it("arms a transit on a repeat visit that skips the entrance", () => {
      // The play-once registry sends a second mount straight to a settled frame,
      // and that path must arm the schedule too or a returning visitor gets none.
      const first = createFieldHarness();
      const stopFirst = startField(first.canvas, "transit replay");
      first.flush(ENTRANCE_BUDGET); // the registry is only written once it lands
      stopFirst();
      vi.unstubAllGlobals();

      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit replay");
      expect(harness.pending()).toBe(0); // no entrance to run
      harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
      expect(harness.pending()).toBe(1);
      stop();
    });

    it("clears the transit timer on teardown", () => {
      const harness = createFieldHarness();
      const stop = startField(harness.canvas, "transit teardown");
      settle(harness);
      expect(harness.pendingTimers()).toBeGreaterThan(0);
      stop();
      expect(harness.pendingTimers()).toBe(0);
      harness.advanceClock(TRANSIT_MAX_GAP_MS * 2);
      expect(harness.pending()).toBe(0);
    });

    it("gives a different title a different cadence", () => {
      // Cadence draws from a dedicated seeded generator, so it is deterministic
      // per title — which is what makes the timing assertions above possible.
      const gaps: number[] = [];
      for (const title of ["cadence one", "cadence two"]) {
        const harness = createFieldHarness();
        const stop = startField(harness.canvas, title);
        harness.flush(400);
        harness.advanceClock(TRANSIT_FIRST_DELAY_MS);
        harness.flush(400);
        let elapsed = 0;
        while (harness.pending() === 0 && elapsed < TRANSIT_MAX_GAP_MS + 1000) {
          harness.advanceClock(500);
          elapsed += 500;
        }
        gaps.push(elapsed);
        stop();
        vi.unstubAllGlobals();
      }
      expect(gaps[0]).not.toBe(gaps[1]);
    });
  });

  // Nested inside `HeroField` on purpose: the `afterEach` above is what unstubs
  // the globals each harness installs, and an afterEach only covers its own
  // describe. As a sibling block these tests would leave `setTimeout` stubbed
  // for whatever runs next.
  describe("field harness platform", () => {
    // Armed through `window.setTimeout` rather than the bare global, so the
    // `windowStub` timer members stay pinned as well: both paths are reachable
    // from production code and each needs a test that fails without it.
    it("fires timers in due order when the clock advances", () => {
      const harness = createFieldHarness();
      const order: string[] = [];
      window.setTimeout(() => order.push("late"), 200);
      window.setTimeout(() => order.push("early"), 50);
      expect(harness.pendingTimers()).toBe(2);

      harness.advanceClock(100);
      expect(order).toEqual(["early"]);
      expect(harness.pendingTimers()).toBe(1);

      harness.advanceClock(100);
      expect(order).toEqual(["early", "late"]);
      expect(harness.pendingTimers()).toBe(0);
    });

    it("picks the earliest-due timer, not the first-armed, within one window", () => {
      const harness = createFieldHarness();
      const order: string[] = [];
      // Both due inside the single window below, and armed in the opposite order
      // to their due times — so array order and due order genuinely disagree.
      // The test above cannot catch a comparator that just takes the first entry
      // in range, because there `late` is alone in its window.
      window.setTimeout(() => order.push("late"), 200);
      window.setTimeout(() => order.push("early"), 50);

      harness.advanceClock(300);
      expect(order).toEqual(["early", "late"]);
      expect(harness.pendingTimers()).toBe(0);
    });

    it("breaks a due-time tie in arming order", () => {
      const harness = createFieldHarness();
      const order: string[] = [];
      window.setTimeout(() => order.push("first"), 50);
      window.setTimeout(() => order.push("second"), 50);

      harness.advanceClock(50);
      // The FIFO half of the documented ordering, and the reason the comparator
      // uses a strict `<`: `<=` would take the later array entry on a tie and
      // fire equal-due timers backwards.
      expect(order).toEqual(["first", "second"]);
      expect(harness.pendingTimers()).toBe(0);
    });

    // The bare globals, not `window.`-prefixed: that is how the field already
    // reaches for `requestAnimationFrame`, so a transit timer would plausibly be
    // armed the same way. Unstubbed, `setTimeout` here would be Node's — the
    // callback would sit on the real event loop instead of this queue, and
    // `clearTimeout` would be handed an id it knows nothing about.
    it("does not fire a cleared timer", () => {
      const harness = createFieldHarness();
      let fired = false;
      const id = setTimeout(() => {
        fired = true;
      }, 50);
      expect(harness.pendingTimers()).toBe(1);

      clearTimeout(id);
      expect(harness.pendingTimers()).toBe(0);
      harness.advanceClock(500);
      expect(fired).toBe(false);
    });

    it("fires a timer armed from inside a timer callback", () => {
      const harness = createFieldHarness();
      const order: string[] = [];
      window.setTimeout(() => {
        order.push("first");
        window.setTimeout(() => order.push("second"), 10);
      }, 10);
      harness.advanceClock(100);
      expect(order).toEqual(["first", "second"]);
    });

    it("does not rewind the clock for an overdue timer", () => {
      const harness = createFieldHarness();
      const order: string[] = [];
      // Due at +100, but a live frame chain carries the clock well past that
      // before any advanceClock reaches it. Every test that flushes a long
      // entrance and then waits on a timer lands in exactly this state.
      window.setTimeout(() => {
        order.push("outer");
        window.setTimeout(() => order.push("inner"), 200);
      }, 100);
      requestAnimationFrame(function spin() {
        requestAnimationFrame(spin);
      });
      harness.flush(20); // clock 1000 -> 1320, past the timer's due time of 1100

      harness.advanceClock(1);
      // The overdue callback runs at "now" (1320) the way a browser runs it, not
      // retroactively at the 1100 it missed — so the timer it arms is due 1520
      // and stays pending. Rewinding to 1100 would make that inner timer due
      // 1300, inside this very 1321 window, and fire it here.
      expect(order).toEqual(["outer"]);
      expect(harness.pendingTimers()).toBe(1);
    });

    it("advancing the clock queues no animation frames on its own", () => {
      const harness = createFieldHarness();
      let ran = 0;
      requestAnimationFrame(() => {
        ran++;
      });
      harness.advanceClock(60_000);
      // Still queued AND still unrun. Asserting only that nothing is pending
      // would pass trivially when no frame was ever requested, which is what
      // made the first version of this test unable to fail — and it is the test
      // carrying the guarantee every "zero frames while idle" assertion rests
      // on, so it has to observe a frame surviving unexecuted.
      expect(harness.pending()).toBe(1);
      expect(ran).toBe(0);
    });

    it("shares one clock between timers and frame timestamps", () => {
      const harness = createFieldHarness();
      const stamps: number[] = [];
      harness.advanceClock(5_000);
      // The bare global, not `window.requestAnimationFrame`: that is how the
      // field asks for frames, and `windowStub` deliberately carries only the
      // timer members.
      requestAnimationFrame((now) => stamps.push(now));
      harness.flush(1);
      // The clock starts at 1000, so 5s of timer time plus one 16ms frame puts
      // this at 6016. The threshold has to clear 6000, not 5000: timers running
      // on a clock of their own would leave the frame stamped ~1016, and a 5000
      // floor would not have caught the 1000ms start offset either way.
      expect(stamps[0]).toBeGreaterThanOrEqual(6_000);
    });

    it("reports a changed rect through setSize without notifying the observer", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const seen: Array<{ width: number; height: number }> = [];
      new ResizeObserver((entries) => {
        for (const entry of entries) seen.push({ ...entry.contentRect });
      }).observe(harness.canvas);

      harness.setSize(400, 200);
      expect(harness.canvas.getBoundingClientRect().width).toBe(400);
      expect(harness.canvas.getBoundingClientRect().height).toBe(200);
      expect(seen).toHaveLength(0);

      harness.triggerResize();
      // The delivered entry has to carry the new size, not just arrive: the
      // coordinate-fix task could read `contentRect` instead of re-measuring,
      // and asserting only the notification count would let it read zeroes.
      expect(seen).toEqual([{ width: 400, height: 200 }]);
    });

    it("delivers nothing through a disconnected ResizeObserver", () => {
      const harness = createFieldHarness();
      let notified = 0;
      const observer = new ResizeObserver(() => {
        notified++;
      });
      observer.observe(harness.canvas);
      observer.disconnect();
      harness.triggerResize();
      expect(notified).toBe(0);
      expect(harness.resizeObserver.disconnected).toBe(true);
    });
  });
});
