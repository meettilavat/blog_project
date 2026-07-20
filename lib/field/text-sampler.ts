export type SampleTitlePointsOptions = {
  text: string;
  width: number;
  height: number;
  font: string;
  maxPoints: number;
  /** Injected for testability; in the browser pass () => canvas.getContext("2d"). */
  getContext: () => CanvasRenderingContext2D | null;
};

const ALPHA_THRESHOLD = 128;
const GRID_STEP = 2; // px between sample candidates

export function sampleTitlePoints({
  text,
  width,
  height,
  font,
  maxPoints,
  getContext
}: SampleTitlePointsOptions): Float32Array {
  if (!text.trim() || width <= 0 || height <= 0 || maxPoints <= 0) {
    return new Float32Array(0);
  }
  const ctx = getContext();
  if (!ctx) return new Float32Array(0);

  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, 0, Math.floor(height / 2));

  const image = ctx.getImageData(0, 0, width, height);
  const candidates: number[] = [];
  for (let y = 0; y < height; y += GRID_STEP) {
    for (let x = 0; x < width; x += GRID_STEP) {
      const alpha = image.data[(y * width + x) * 4 + 3];
      if (alpha >= ALPHA_THRESHOLD) {
        candidates.push(x, y);
      }
    }
  }

  const total = candidates.length / 2;
  if (total === 0) return new Float32Array(0);

  const keep = Math.min(total, maxPoints);
  const out = new Float32Array(keep * 2);
  const stride = total / keep;
  for (let i = 0; i < keep; i++) {
    const src = Math.floor(i * stride) * 2;
    out[i * 2] = candidates[src];
    out[i * 2 + 1] = candidates[src + 1];
  }
  return out;
}
