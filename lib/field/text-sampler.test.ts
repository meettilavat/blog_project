import { describe, expect, it } from "vitest";
import { sampleTitlePoints } from "@/lib/field/text-sampler";

// Minimal 2D-context stub: filled text marks pixels opaque in a known band.
function makeStubContext(alphaMask: (x: number, y: number) => number) {
  const calls: { text?: string } = {};
  return {
    calls,
    canvas: { width: 0, height: 0 },
    set fillStyle(_v: string) {},
    set font(_v: string) {},
    set textBaseline(_v: string) {},
    fillRect() {},
    fillText(t: string) { calls.text = t; },
    getImageData(_x: number, _y: number, w: number, h: number) {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = alphaMask(x, y);
          const i = (y * w + x) * 4;
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = a;
        }
      }
      return { data, width: w, height: h };
    }
  } as unknown as CanvasRenderingContext2D;
}

describe("sampleTitlePoints", () => {
  it("returns interleaved x,y points inside opaque regions", () => {
    // Opaque everywhere in a 40x20 box at origin.
    const ctx = makeStubContext(() => 255);
    const pts = sampleTitlePoints({
      text: "Hi", width: 40, height: 20, font: "700 20px 'Space Grotesk'",
      maxPoints: 100, getContext: () => ctx
    });
    expect(pts.length).toBeGreaterThan(0);
    expect(pts.length % 2).toBe(0);
    for (let i = 0; i < pts.length; i += 2) {
      expect(pts[i]).toBeGreaterThanOrEqual(0);
      expect(pts[i]).toBeLessThanOrEqual(40);
      expect(pts[i + 1]).toBeGreaterThanOrEqual(0);
      expect(pts[i + 1]).toBeLessThanOrEqual(20);
    }
  });

  it("returns an empty array for empty text", () => {
    const ctx = makeStubContext(() => 255);
    const pts = sampleTitlePoints({ text: "", width: 40, height: 20, font: "700 20px 'Space Grotesk'", maxPoints: 100, getContext: () => ctx });
    expect(pts.length).toBe(0);
  });

  it("is deterministic for the same input", () => {
    const a = sampleTitlePoints({ text: "Hi", width: 40, height: 20, font: "f", maxPoints: 50, getContext: () => makeStubContext(() => 255) });
    const b = sampleTitlePoints({ text: "Hi", width: 40, height: 20, font: "f", maxPoints: 50, getContext: () => makeStubContext(() => 255) });
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("respects maxPoints by striding", () => {
    const ctx = makeStubContext(() => 255);
    const pts = sampleTitlePoints({ text: "X", width: 100, height: 100, font: "f", maxPoints: 25, getContext: () => ctx });
    expect(pts.length / 2).toBeLessThanOrEqual(25);
  });
});
