import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge } from "../badge";

describe("components/ui/badge.tsx", () => {
  it("renders label text with requested variant styling", () => {
    const html = renderToStaticMarkup(
      <Badge variant="outline" className="custom-badge">
        Draft
      </Badge>
    );

    expect(html).toContain("Draft");
    expect(html).toContain("custom-badge");
    expect(html).toContain("border border-foreground/40");
  });
});
