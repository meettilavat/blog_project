import { describe, expect, it } from "vitest";
import preset from "./preset.mjs";

describe("config/tailwind/preset.mjs", () => {
  it("defines required semantic color tokens", () => {
    const colors = preset.theme?.extend?.colors as Record<string, string>;

    expect(colors.border).toBe("var(--border)");
    expect(colors.muted).toBe("var(--muted)");
    expect(colors.foreground).toBe("var(--foreground)");
    expect(colors.accent).toBe("var(--accent)");
    expect(colors.background).toBe("var(--background)");
    expect(colors.card).toBe("var(--card)");
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
});
