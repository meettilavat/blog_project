import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { motionDivMock } = vi.hoisted(() => ({
  motionDivMock: vi.fn(
    ({
      children,
      className
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>
  )
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: (props: unknown) => motionDivMock(props)
  }
}));

import { RevealSection } from "./reveal-section";

describe("components/profile/reveal-section.tsx", () => {
  beforeEach(() => {
    motionDivMock.mockClear();
  });

  it("renders children and applies reveal animation props", () => {
    const html = renderToStaticMarkup(
      <RevealSection className="reveal-class" delay={0.3}>
        <span>Reveal content</span>
      </RevealSection>
    );
    const props = motionDivMock.mock.calls[0]?.[0] as {
      initial: { opacity: number; y: number; filter: string };
      whileInView: { transition: { duration: number; delay: number; ease: readonly number[] } };
      viewport: { once: boolean; margin: string };
    };

    expect(html).toContain("reveal-class");
    expect(html).toContain("Reveal content");
    expect(props.initial).toEqual({ opacity: 0, y: 28, filter: "blur(4px)" });
    expect(props.whileInView.transition).toEqual({
      duration: 0.55,
      delay: 0.3,
      ease: [0.25, 0.4, 0.25, 1]
    });
    expect(props.viewport).toEqual({ once: true, margin: "-80px" });
  });
});
