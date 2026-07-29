import { vi } from "vitest";

/**
 * Platform stubs for driving `startField()` (components/field/hero-field.tsx)
 * under Vitest's `environment: "node"`.
 *
 * The field's headline guarantee is a *frame budget* — zero frames when idle,
 * offscreen, or hidden — and that is only observable by stepping the loop by
 * hand and asking how many frames are still queued. So the animation-frame
 * queue here is a real queue: `pending()` is its length, and `flush()` runs one
 * batch at a time exactly as the browser does, letting callbacks re-queue
 * themselves. A loop that never halts leaves frames pending; a loop that halts
 * drains to zero.
 *
 * The 2d context records every paint instead of rasterising, so tests assert on
 * particle positions and alpha rather than on pixels. Only the members the
 * component actually uses are implemented: if it starts calling something else,
 * the tests fail loudly rather than passing vacuously.
 *
 * Constructing a harness **stubs ten globals as a side effect**
 * (`requestAnimationFrame`, `cancelAnimationFrame`, `IntersectionObserver`,
 * `MutationObserver`, `getComputedStyle`, `window`, `document`, `setTimeout`,
 * `clearTimeout`, `ResizeObserver`), because the code under test reaches for
 * them the way it does in a browser. Two consequences worth knowing:
 *
 * - **One live harness at a time.** The stubs are process-global, so a second
 *   harness replaces the first one's globals; an already-started field would
 *   then request frames from the newer queue. Create the next harness only
 *   after the previous field is torn down.
 * - **The caller owns cleanup.** Call `vi.unstubAllGlobals()` in an `afterEach`
 *   (as `components/field/hero-field.test.tsx` does). The harness deliberately
 *   exposes no `restore()` of its own: it cannot restore only its own stubs, so
 *   offering a per-harness-looking method would misrepresent what it does.
 */

/** One recorded paint: what `draw()` put on the canvas for a single frame. */
export type FieldFrame = {
  fillStyle: string;
  dots: Array<{ x: number; y: number; alpha: number }>;
};

export type FieldHarnessOptions = {
  /**
   * Whether `(hover: hover) and (pointer: fine)` matches. `false` models a
   * touch device, which must attach no pointer listeners at all.
   */
  interactive?: boolean;
  width?: number;
  height?: number;
  devicePixelRatio?: number;
  accent?: string;
  /** Start with `document.hidden` already true (a background-tab mount). */
  hidden?: boolean;
};

type Listener = (event: unknown) => void;

/**
 * How many timers one `advanceClock` call will fire before it gives up. Named so
 * the throw below can quote the real limit instead of a hand-copied literal that
 * drifts the first time the guard is retuned.
 */
const MAX_TIMERS_PER_ADVANCE = 10_000;

function createListenerTarget() {
  const listeners = new Map<string, Listener[]>();
  return {
    addEventListener(type: string, handler: Listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), handler]);
    },
    removeEventListener(type: string, handler: Listener) {
      const remaining = (listeners.get(type) ?? []).filter((entry) => entry !== handler);
      listeners.set(type, remaining);
    },
    listenerCount(type: string) {
      return (listeners.get(type) ?? []).length;
    },
    /**
     * A listener removed before this call never fires. The list is snapshotted
     * first, so a listener removed by an earlier handler *within the same
     * dispatch* still runs — unlike the DOM, which would skip it. No field
     * listener removes another, so the difference never shows.
     */
    emit(type: string, event: unknown = {}) {
      for (const handler of [...(listeners.get(type) ?? [])]) handler(event);
    }
  };
}

/** Largest distance any particle sits from its counterpart in `base`. */
export function maxDrift(
  base: Array<{ x: number; y: number }>,
  current: Array<{ x: number; y: number }>
): number {
  if (base.length !== current.length) {
    throw new Error(`particle count changed: ${base.length} -> ${current.length}`);
  }
  let worst = 0;
  for (let i = 0; i < base.length; i++) {
    const distance = Math.hypot(current[i].x - base[i].x, current[i].y - base[i].y);
    if (distance > worst) worst = distance;
  }
  return worst;
}

export function createFieldHarness(options: FieldHarnessOptions = {}) {
  let width = options.width ?? 800;
  let height = options.height ?? 400;
  const devicePixelRatio = options.devicePixelRatio ?? 2;
  const interactive = options.interactive ?? true;
  let accent = options.accent ?? "#F2A93B";
  let hidden = options.hidden ?? false;

  // ---- animation frames: queue length IS "frames pending" ----
  let nextFrameId = 0;
  let queue: Array<{ id: number; callback: (now: number) => void }> = [];
  // A realistic non-zero start: real rAF timestamps are never 0.
  let clock = 1000;

  const requestAnimationFrameStub = (callback: (now: number) => void) => {
    const id = ++nextFrameId;
    queue.push({ id, callback });
    return id;
  };
  const cancelAnimationFrameStub = (id: number) => {
    queue = queue.filter((entry) => entry.id !== id);
  };

  // ---- virtual timers, on the SAME clock as animation frames ----
  // The transit schedule is time-driven (setTimeout between events, never a live
  // rAF chain), so proving "no frames across an idle gap" requires advancing time
  // without running frames. One clock for both, because the production code
  // stamps a transit's start from an rAF timestamp after a timer raised a flag —
  // two clocks would make that offset untestable.
  let nextTimerId = 0;
  let timers: Array<{ id: number; due: number; callback: () => void }> = [];

  const setTimeoutStub = (callback: () => void, delay = 0) => {
    const id = ++nextTimerId;
    timers.push({ id, due: clock + Math.max(0, delay), callback });
    return id;
  };
  const clearTimeoutStub = (id: number) => {
    timers = timers.filter((entry) => entry.id !== id);
  };

  // ---- recording 2d context ----
  const frames: FieldFrame[] = [];
  let fillStyle = "";
  let globalAlpha = 1;
  // The effective scale, tracked the way the real API composes it rather than as
  // "whatever was passed last". Two reasons this matters:
  //
  //   `scale()` multiplies into the current transform, so a caller that rescales
  //   without resetting first ends up at 4x, not 2x. Recording absolutely would
  //   report a tidy 2x either way, which made the dpr assertion unfalsifiable.
  //
  //   Assigning `canvas.width` resets the transform per spec, but engines have
  //   been observed skipping that when the assigned value is unchanged. This stub
  //   deliberately models the pessimistic engine and never resets on its own, so
  //   production code is forced to reset explicitly and a missing reset shows up
  //   here as a compounded scale instead of passing on a friendlier browser.
  let scale: { x: number; y: number } | null = null;

  const context = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: string) {
      fillStyle = value;
    },
    get globalAlpha() {
      return globalAlpha;
    },
    set globalAlpha(value: number) {
      globalAlpha = value;
    },
    scale(x: number, y: number) {
      scale = scale ? { x: scale.x * x, y: scale.y * y } : { x, y };
    },
    /**
     * Only the two scale components are modelled — the field never rotates,
     * skews, or translates, and a stub that pretended to carry a full matrix
     * would invite a caller to rely on something untested.
     */
    setTransform(a: number, _b: number, _c: number, d: number) {
      scale = { x: a, y: d };
    },
    // `draw()` clears first, so a clear opens a new recorded frame.
    clearRect() {
      frames.push({ fillStyle, dots: [] });
    },
    fillRect(x: number, y: number) {
      const frame = frames[frames.length - 1];
      if (!frame) throw new Error("fillRect before any clearRect: draw() must clear first");
      frame.fillStyle = fillStyle;
      frame.dots.push({ x, y, alpha: globalAlpha });
    }
  };

  const host = createListenerTarget();
  const canvasStub = {
    width: 0,
    height: 0,
    parentElement: host,
    getContext: (kind: string) => (kind === "2d" ? context : null),
    getBoundingClientRect: () => ({
      width,
      height,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0
    })
  };

  // ---- observers ----
  type IntersectionCallback = (entries: Array<{ isIntersecting: boolean; target: unknown }>) => void;
  const intersection = {
    callback: null as IntersectionCallback | null,
    options: undefined as unknown,
    targets: [] as unknown[],
    disconnected: false
  };
  class IntersectionObserverStub {
    constructor(callback: IntersectionCallback, observerOptions?: unknown) {
      intersection.callback = callback;
      intersection.options = observerOptions;
    }
    observe(target: unknown) {
      intersection.targets.push(target);
    }
    unobserve(target: unknown) {
      intersection.targets = intersection.targets.filter((entry) => entry !== target);
    }
    disconnect() {
      intersection.disconnected = true;
    }
    takeRecords() {
      return [];
    }
  }

  const mutation = {
    callback: null as (() => void) | null,
    target: undefined as unknown,
    options: undefined as unknown,
    disconnected: false
  };
  class MutationObserverStub {
    constructor(callback: () => void) {
      mutation.callback = callback;
    }
    observe(target: unknown, observerOptions?: unknown) {
      mutation.target = target;
      mutation.options = observerOptions;
    }
    disconnect() {
      mutation.disconnected = true;
    }
    takeRecords() {
      return [];
    }
  }

  type ResizeCallback = (
    entries: Array<{ target: unknown; contentRect: { width: number; height: number } }>
  ) => void;
  const resize = {
    callback: null as ResizeCallback | null,
    targets: [] as unknown[],
    disconnected: false
  };
  class ResizeObserverStub {
    constructor(callback: ResizeCallback) {
      resize.callback = callback;
    }
    observe(target: unknown) {
      resize.targets.push(target);
    }
    unobserve(target: unknown) {
      resize.targets = resize.targets.filter((entry) => entry !== target);
    }
    disconnect() {
      resize.disconnected = true;
    }
  }

  // ---- document / window ----
  const documentElement = { nodeName: "HTML" };
  const documentTarget = createListenerTarget();
  const documentStub = {
    get hidden() {
      return hidden;
    },
    documentElement,
    addEventListener: documentTarget.addEventListener,
    removeEventListener: documentTarget.removeEventListener
  };

  const mediaQueries: string[] = [];
  const windowStub = {
    devicePixelRatio,
    setTimeout: setTimeoutStub,
    clearTimeout: clearTimeoutStub,
    matchMedia: (query: string) => {
      mediaQueries.push(query);
      // Every query answers with the configured capability: tests assert on
      // *which* query was asked, so the harness must not encode it here.
      return { matches: interactive, media: query };
    }
  };

  const getComputedStyleStub = (element: unknown) => {
    if (element !== documentElement) {
      throw new Error("getComputedStyle called on something other than documentElement");
    }
    return {
      getPropertyValue: (property: string) => (property === "--accent" ? accent : "")
    };
  };

  vi.stubGlobal("requestAnimationFrame", requestAnimationFrameStub);
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameStub);
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  vi.stubGlobal("MutationObserver", MutationObserverStub);
  vi.stubGlobal("getComputedStyle", getComputedStyleStub);
  vi.stubGlobal("window", windowStub);
  vi.stubGlobal("document", documentStub);
  // Both access paths, on purpose. `windowStub` carries the timer members for
  // `window.setTimeout(...)` callers, and these two cover the bare globals —
  // which is the idiom the field already uses for frames (`requestAnimationFrame`
  // in `schedule()`). Without them, production code arming a bare `setTimeout`
  // would get Node's real timer: it would fire on the real event loop, i.e.
  // never inside a synchronous test, while `pendingTimers()` reported 0.
  vi.stubGlobal("setTimeout", setTimeoutStub);
  vi.stubGlobal("clearTimeout", clearTimeoutStub);
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);

  return {
    /** Pass to `startField()`. */
    canvas: canvasStub as unknown as HTMLCanvasElement,
    /** The element listeners must attach to — never the canvas itself. */
    host,
    /** Every recorded paint, oldest first. */
    frames,
    /** Which media queries the field probed, in order. */
    mediaQueries,

    /** Frames still queued. Zero means the loop has genuinely stopped. */
    pending() {
      return queue.length;
    },
    /**
     * Handles of the queued frames. Lets a test tell "the same frame is still
     * queued" from "that frame was cancelled and an identical one requested",
     * which a count alone cannot distinguish.
     */
    pendingIds() {
      return queue.map((entry) => entry.id);
    },
    /**
     * Runs up to `maxFrames` batches, advancing a virtual clock. Stops early
     * when the queue drains, and returns how many frames actually ran — so
     * `ran < maxFrames` proves the loop halted on its own.
     *
     * Mirroring `advanceClock`, this moves the clock but fires **no timers**: a
     * timer that comes due inside the span these frames cover stays pending
     * until an `advanceClock` reaches it. Only `advanceClock` fires timers. That
     * keeps frames and time-driven work independently drivable, at the cost that
     * the clock can end up past a pending timer's due time — `flush(1000)` is
     * 16s of virtual time — which is why `advanceClock` fires an overdue timer
     * at the current clock rather than rewinding to the due time it missed.
     */
    flush(maxFrames = 1, deltaMs = 16) {
      let ran = 0;
      for (let i = 0; i < maxFrames; i++) {
        if (queue.length === 0) break;
        const due = queue;
        queue = [];
        clock += deltaMs;
        for (const entry of due) entry.callback(clock);
        ran++;
      }
      return ran;
    },
    paintCount() {
      return frames.length;
    },
    lastFrame() {
      const frame = frames[frames.length - 1];
      if (!frame) throw new Error("nothing has been painted yet");
      return frame;
    },
    /** Particle positions from the most recent paint, in particle order. */
    positions() {
      return this.lastFrame().dots.map((dot) => ({ x: dot.x, y: dot.y }));
    },
    maxAlpha() {
      return this.lastFrame().dots.reduce((peak, dot) => Math.max(peak, dot.alpha), 0);
    },
    /** The dpr transform the field applied, or null if it never scaled. */
    scaleApplied() {
      return scale;
    },

    /**
     * Advances the shared clock, firing timers whose due time falls inside the
     * window, **earliest-due first** — not arming order: a timer armed second
     * but due sooner fires first. Timers sharing a due time fire in arming
     * order, the FIFO guarantee a browser gives; that follows from the strict
     * `<` in the comparator below, so `<=` would silently reverse it.
     *
     * Deliberately does NOT run animation frames: a test that advances 30s and
     * then asserts `pending() === 0` is what proves the transit schedule uses
     * timers rather than a live rAF chain.
     *
     * A timer armed from inside a callback and due within the same window still
     * fires, matching the browser. A callback that re-arms itself at zero delay
     * would otherwise spin forever, so the cap throws rather than returning: a
     * silent bail would surface as an inexplicable assertion failure somewhere
     * downstream, with nothing pointing back here.
     */
    advanceClock(ms: number) {
      const target = clock + ms;
      for (let guard = 0; ; guard++) {
        let next: { id: number; due: number; callback: () => void } | null = null;
        for (const entry of timers) {
          if (entry.due <= target && (!next || entry.due < next.due)) next = entry;
        }
        if (!next) break;
        // Checked here rather than at the top of the loop so the evidence below
        // is real: after the last timer drains there is nothing to report on.
        if (guard >= MAX_TIMERS_PER_ADVANCE) {
          throw new Error(
            `advanceClock(${ms}) fired ${MAX_TIMERS_PER_ADVANCE} timers without draining — ` +
              `most likely a timer callback re-arming itself inside the window, though ` +
              `${MAX_TIMERS_PER_ADVANCE} independent timers due in the same span look identical ` +
              `from here. Still pending: ${timers.length}, earliest due ${next.due}; ` +
              `clock ${clock}, window ends ${target}.`
          );
        }
        timers = timers.filter((entry) => entry !== next);
        // `max`, not assignment: `flush()` can already have carried the clock
        // past this timer's due time, and an overdue timer fires at *now* — a
        // browser does not rewind time to the deadline it missed. Assigning
        // would run the callback at a stale clock, so a timer it arms would be
        // dated from that stale value and could come due inside this very
        // window: a transit chained off a timer would start thousands of ms
        // early, with nothing pointing at the harness.
        clock = Math.max(clock, next.due);
        next.callback();
      }
      clock = target;
    },
    pendingTimers() {
      return timers.length;
    },

    /**
     * Changes what `getBoundingClientRect()` reports *without* notifying the
     * ResizeObserver — which is precisely the Safari scenario: the element's box
     * changed (a webfont swap relaid the headline) while the field still holds
     * the size it measured at mount.
     */
    setSize(nextWidth: number, nextHeight: number) {
      width = nextWidth;
      height = nextHeight;
    },
    /** Invokes the ResizeObserver callback, as the browser would. */
    triggerResize() {
      if (!resize.callback) throw new Error("no ResizeObserver was created");
      if (resize.disconnected) return;
      resize.callback([{ target: canvasStub, contentRect: { width, height } }]);
    },
    resizeObserver: resize,

    movePointer(x: number, y: number) {
      host.emit("pointermove", { clientX: x, clientY: y });
    },
    leavePointer() {
      host.emit("pointerleave", {});
    },

    /** Invokes the IntersectionObserver callback, as the browser would. */
    setIntersecting(isIntersecting: boolean) {
      if (!intersection.callback) throw new Error("no IntersectionObserver was created");
      // A disconnected observer delivers nothing.
      if (intersection.disconnected) return;
      intersection.callback([{ isIntersecting, target: canvasStub }]);
    },
    intersectionObserver: intersection,
    mutationObserver: mutation,

    /** Invokes the theme MutationObserver callback. */
    triggerMutation() {
      if (!mutation.callback) throw new Error("no MutationObserver was created");
      if (mutation.disconnected) return;
      mutation.callback();
    },
    setAccent(value: string) {
      accent = value;
    },
    /** Sets `document.hidden` without firing the event. */
    setHidden(value: boolean) {
      hidden = value;
    },
    emitVisibilityChange() {
      documentTarget.emit("visibilitychange");
    },
    documentListenerCount(type: string) {
      return documentTarget.listenerCount(type);
    },
    documentElement
  };
}
