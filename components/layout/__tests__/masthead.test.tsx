import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Masthead } from "../masthead";

describe("Masthead", () => {
  it("renders the typographic issue line and availability status", () => {
    const html = renderToStaticMarkup(
      <Masthead eyebrow="Meet Tilavat · Software Engineer" title="Notes on building software & systems." dek="Writing about web engineering." note="Production notes." resumeHref="/resume" />
    );
    expect(html).toContain("Issue ongoing");
    expect(html).toContain("Open to full-time roles");
    expect(html).toContain("UTC+05:30");
    expect(html).toContain("Notes on building software");
    expect(html).toContain("View resume");
    expect(html).toContain('href="/resume"');
  });
});
