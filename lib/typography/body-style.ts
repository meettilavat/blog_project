export type BodyStyle = "sans" | "serif";

export function isBodyStyle(value: unknown): value is BodyStyle {
  return value === "sans" || value === "serif";
}

