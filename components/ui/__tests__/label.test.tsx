import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Label } from "@/components/ui/label";

describe("components/ui/label", () => {
  it("renders htmlFor and text content", () => {
    const html = renderToStaticMarkup(<Label htmlFor="post-title">Title</Label>);
    expect(html).toContain('for="post-title"');
    expect(html).toContain(">Title<");
  });

  it("merges base and custom classes", () => {
    const html = renderToStaticMarkup(<Label className="uppercase">Name</Label>);
    expect(html).toContain("uppercase");
    expect(html).toContain("font-medium");
  });
});
