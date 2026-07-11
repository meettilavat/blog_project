import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FadeIn } from "./fade-in";

describe("components/motion/fade-in.tsx", () => {
  it("renders content visible in server HTML", () => {
    const html = renderToStaticMarkup(
      <FadeIn className="fade-class" delay={0.2} duration={0.8} whileInView y={40}>
        <span>Child</span>
      </FadeIn>
    );

    expect(html).toContain("fade-class");
    expect(html).toContain("journal-reveal");
    expect(html).toContain("--reveal-delay:0.2s");
    expect(html).toContain("--reveal-duration:0.8s");
    expect(html).toContain("--reveal-y:40px");
    expect(html).toContain(">Child<");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("blur(");
    expect(html).not.toContain("translateY");
  });
});
