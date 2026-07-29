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
    /** Dispatches to current listeners only — a removed listener never fires. */
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
  const width = options.width ?? 800;
  const height = options.height ?? 400;
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

  // ---- recording 2d context ----
  const frames: FieldFrame[] = [];
  let fillStyle = "";
  let globalAlpha = 1;
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
      scale = { x, y };
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
     * Runs up to `maxFrames` batches, advancing a virtual clock. Stops early
     * when the queue drains, and returns how many frames actually ran — so
     * `ran < maxFrames` proves the loop halted on its own.
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
    documentElement,

    restore() {
      vi.unstubAllGlobals();
    }
  };
}
