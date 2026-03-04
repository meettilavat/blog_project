import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";

describe("components/ui/input", () => {
  it("merges base and custom classes", () => {
    const html = renderToStaticMarkup(<Input className="custom-input-class" />);
    expect(html).toContain("custom-input-class");
    expect(html).toContain("rounded-xl");
  });

  it("passes through native input attributes", () => {
    const html = renderToStaticMarkup(
      <Input
        type="email"
        name="authorEmail"
        placeholder="author@example.com"
        required
      />
    );
    expect(html).toContain('type="email"');
    expect(html).toContain('name="authorEmail"');
    expect(html).toContain('placeholder="author@example.com"');
    expect(html).toContain("required");
  });
});
