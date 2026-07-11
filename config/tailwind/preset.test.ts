import { describe, expect, it } from "vitest";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import preset from "./preset.mjs";

describe("config/tailwind/preset.mjs", () => {
  it("defines required semantic color tokens", () => {
    const colors = preset.theme?.extend?.colors as Record<string, string>;

    expect(colors.border).toBe("rgb(var(--border-rgb) / <alpha-value>)");
    expect(colors.muted).toBe("rgb(var(--muted-rgb) / <alpha-value>)");
    expect(colors.foreground).toBe("rgb(var(--foreground-rgb) / <alpha-value>)");
    expect(colors.accent).toBe("rgb(var(--accent-rgb) / <alpha-value>)");
    expect(colors.background).toBe("rgb(var(--background-rgb) / <alpha-value>)");
    expect(colors.card).toBe("rgb(var(--card-rgb) / <alpha-value>)");
  });

  it("compiles opacity modifiers for semantic journal colors", async () => {
    const result = await postcss([
      tailwindcss({
        ...preset,
        content: [{
          raw: '<div class="text-foreground/70 border-border/75 bg-background/[0.97] border-accent/65"></div>',
          extension: "html"
        }]
      })
    ]).process("@tailwind utilities;", { from: undefined });

    expect(result.css).toContain("color: rgb(var(--foreground-rgb) / 0.7)");
    expect(result.css).toContain("border-color: rgb(var(--border-rgb) / 0.75)");
    expect(result.css).toContain("background-color: rgb(var(--background-rgb) / 0.97)");
    expect(result.css).toContain("border-color: rgb(var(--accent-rgb) / 0.65)");
  });

  it("defines required font and container tokens", () => {
    const fontFamily = preset.theme?.extend?.fontFamily as Record<string, string[]>;
    const container = preset.theme?.container as {
      center: boolean;
      padding: string;
      screens: Record<string, string>;
    };

    expect(fontFamily.sans[0]).toBe("var(--font-grotesk)");
    expect(fontFamily.serif[0]).toBe("var(--font-serif)");
    expect(fontFamily.mono[0]).toBe("var(--font-mono)");
    expect(container.center).toBe(true);
    expect(container.padding).toBe("1.25rem");
    expect(container.screens["2xl"]).toBe("1100px");
  });

  it("defines content-based journal breakpoints in one unit system", () => {
    const screens = preset.theme?.extend?.screens as Record<string, string>;

    expect(screens).toEqual({
      micro: "360px",
      note: "544px",
      folio: "768px",
      ledger: "832px",
      project: "896px",
      document: "1152px",
      spread: "1280px",
      marginalia: "1600px"
    });
    expect(Object.values(screens).every((value) => value.endsWith("px"))).toBe(true);
  });
});
