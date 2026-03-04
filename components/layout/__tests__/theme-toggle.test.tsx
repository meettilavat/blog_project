import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ThemeToggle from "@/components/layout/theme-toggle";

describe("components/layout/theme-toggle.tsx", () => {
  it("renders theme toggle button markers", () => {
    const html = renderToStaticMarkup(<ThemeToggle className="custom-theme-toggle" />);

    expect(html).toContain("data-theme-toggle");
    expect(html).toContain("custom-theme-toggle");
    expect(html).toContain("Toggle theme");
  });
});
