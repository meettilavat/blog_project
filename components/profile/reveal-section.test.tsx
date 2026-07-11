import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RevealSection } from "./reveal-section";

describe("components/profile/reveal-section.tsx", () => {
  it("renders resume content visible in server HTML", () => {
    const html = renderToStaticMarkup(
      <RevealSection className="reveal-class" delay={0.3}>
        <span>Reveal content</span>
      </RevealSection>
    );

    expect(html).toContain("reveal-class");
    expect(html).toContain("journal-reveal");
    expect(html).toContain("--reveal-delay:0.3s");
    expect(html).toContain("Reveal content");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("blur(");
  });
});
