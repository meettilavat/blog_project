import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Textarea } from "@/components/ui/textarea";

describe("components/ui/textarea.tsx", () => {
  it("renders textarea with baseline editor classes", () => {
    const html = renderToStaticMarkup(<Textarea value="Excerpt" readOnly />);

    expect(html).toContain("<textarea");
    expect(html).toContain("min-h-[140px]");
    expect(html).toContain(">Excerpt</textarea>");
  });
});
