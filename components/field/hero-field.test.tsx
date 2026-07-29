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
import { LENS_RADIUS_PX } from "@/lib/field/field-motion";
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

      // Unmapped, the raw (380, 180) lands where the headline sits and the field
      // is empty, so nothing brightens at all — which is why this assertion, not
      // the loop below, is the one that fails without the fix.
      expect(brightened.length).toBeGreaterThan(0);
      // And every dot that did brighten sits within the lens radius of the mapped
      // point rather than somewhere else dense.
      for (const dot of brightened) {
        expect(Math.hypot(dot.x - 760, dot.y - 360)).toBeLessThan(LENS_RADIUS_PX + 1);
      }

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

      harness.advanceClock(120);
      expect(harness.paintCount()).toBe(paintsAtRest + 1);
      // A rebuild is a snap, not an animation: no frames are left queued.
      expect(harness.pending()).toBe(0);
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
        harness.advanceClock(50); // each inside the 120ms window
      }
      harness.advanceClock(120);

      expect(harness.paintCount()).toBe(paintsAtRest + 1);
      stop();
    });

    it("ignores a resize that does not change the integer size", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize subpixel");
      harness.flush(400);
      const paintsAtRest = harness.paintCount();

      harness.setSize(800.4, 400.2); // sub-pixel churn from a scrollbar settling
      harness.triggerResize();
      harness.advanceClock(200);

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
      harness.advanceClock(120);

      expect(harness.canvas.width).toBe(1200);
      expect(harness.canvas.height).toBe(600);
      // The dpr itself, not a value derived from it: the field draws in CSS
      // pixels and the transform is what stretches that over the buffer. The
      // harness records the latest `scale()` call verbatim, and the mount already
      // recorded this pair — that the rebuild applies it at all is pinned by the
      // test below, where the dpr changes.
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
      harness.advanceClock(120);

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
      harness.advanceClock(120);

      harness.setSize(800, 400);
      harness.triggerResize();
      harness.advanceClock(120);

      expect(harness.positions()).toEqual(first);
      stop();
    });

    it("ends the entrance when a resize lands mid-condense", () => {
      const harness = createFieldHarness({ width: 800, height: 400 });
      const stop = startField(harness.canvas, "resize during entrance");
      harness.flush(10); // still condensing
      expect(harness.pending()).toBe(1);

      harness.setSize(600, 300);
      harness.triggerResize();
      harness.advanceClock(120);

      // The entrance is over: the field is snapped and no stale tick chain
      // survives to repaint over the rebuild on its next frame.
      expect(harness.pending()).toBe(0);
      const snapped = harness.positions();
      harness.flush(5);
      expect(harness.positions()).toEqual(snapped);
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
