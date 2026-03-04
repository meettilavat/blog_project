import { describe, expect, it, vi, beforeEach } from "vitest";
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

import { FadeIn } from "./fade-in";

describe("components/motion/fade-in.tsx", () => {
  beforeEach(() => {
    motionDivMock.mockClear();
  });

  it("uses animate props by default", () => {
    const html = renderToStaticMarkup(
      <FadeIn className="fade-class">
        <span>Child</span>
      </FadeIn>
    );
    const props = motionDivMock.mock.calls[0]?.[0] as {
      initial: { opacity: number; y: number; filter: string };
      animate?: { transition: { duration: number; delay: number; ease: readonly number[] } };
      whileInView?: unknown;
    };

    expect(html).toContain("fade-class");
    expect(html).toContain(">Child<");
    expect(props.initial).toEqual({ opacity: 0, y: 24, filter: "blur(4px)" });
    expect(props.animate?.transition).toEqual({
      duration: 0.55,
      delay: 0,
      ease: [0.25, 0.4, 0.25, 1]
    });
    expect(props.whileInView).toBeUndefined();
  });

  it("uses whileInView props when requested", () => {
    renderToStaticMarkup(
      <FadeIn whileInView y={40} duration={0.8} delay={0.2}>
        <span>InView</span>
      </FadeIn>
    );
    const props = motionDivMock.mock.calls[0]?.[0] as {
      initial: { opacity: number; y: number; filter: string };
      whileInView?: { transition: { duration: number; delay: number; ease: readonly number[] } };
      viewport?: { once: boolean; margin: string };
      animate?: unknown;
    };

    expect(props.initial).toEqual({ opacity: 0, y: 40, filter: "blur(4px)" });
    expect(props.whileInView?.transition).toEqual({
      duration: 0.8,
      delay: 0.2,
      ease: [0.25, 0.4, 0.25, 1]
    });
    expect(props.viewport).toEqual({ once: true, margin: "-60px" });
    expect(props.animate).toBeUndefined();
  });
});
