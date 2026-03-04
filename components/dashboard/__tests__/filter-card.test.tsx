import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Card, CardContent } from "@/components/dashboard/filter-card";

describe("components/dashboard/filter-card.tsx", () => {
  it("renders card and content wrappers", () => {
    const html = renderToStaticMarkup(
      <Card className="custom-card">
        <CardContent className="custom-content">Body</CardContent>
      </Card>
    );

    expect(html).toContain("custom-card");
    expect(html).toContain("custom-content");
    expect(html).toContain("rounded-2xl");
    expect(html).toContain(">Body<");
  });
});
