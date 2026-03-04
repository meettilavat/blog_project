import { describe, expect, it } from "vitest";
import { cn } from "@/lib/ui/classnames";

describe("lib/ui/classnames.ts", () => {
  it("prefers the last conflicting Tailwind utility", () => {
    expect(cn("px-2", "text-sm", "px-4")).toBe("text-sm px-4");
  });

  it("drops falsy values while keeping valid classes", () => {
    expect(cn("font-semibold", false && "hidden", undefined, null, "tracking-tight")).toBe(
      "font-semibold tracking-tight"
    );
  });
});
