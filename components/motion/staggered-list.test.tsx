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

import { StaggeredItem, StaggeredList } from "./staggered-list";

describe("components/motion/staggered-list.tsx", () => {
  beforeEach(() => {
    motionDivMock.mockClear();
  });

  it("renders list container with default stagger settings", () => {
    const html = renderToStaticMarkup(
      <StaggeredList className="list-class">
        <div>Item A</div>
      </StaggeredList>
    );
    const props = motionDivMock.mock.calls[0]?.[0] as {
      className?: string;
      initial: string;
      animate: string;
      custom: { delay: number; stagger: number };
      variants: { show: (opts: { delay: number; stagger: number }) => { transition: unknown } };
    };

    expect(html).toContain("list-class");
    expect(html).toContain("Item A");
    expect(props.initial).toBe("hidden");
    expect(props.animate).toBe("show");
    expect(props.custom).toEqual({ delay: 0.08, stagger: 0.08 });
    expect(props.variants.show({ delay: 0.2, stagger: 0.1 })).toEqual({
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    });
  });

  it("passes custom delay and stagger values", () => {
    renderToStaticMarkup(
      <StaggeredList delay={0.3} stagger={0.12}>
        <div>Item B</div>
      </StaggeredList>
    );
    const props = motionDivMock.mock.calls[0]?.[0] as {
      custom: { delay: number; stagger: number };
    };

    expect(props.custom).toEqual({ delay: 0.3, stagger: 0.12 });
  });

  it("renders staggered item variants", () => {
    renderToStaticMarkup(
      <StaggeredItem className="item-class">
        <span>Child</span>
      </StaggeredItem>
    );
    const props = motionDivMock.mock.calls[0]?.[0] as {
      className?: string;
      variants: {
        hidden: { opacity: number; y: number; filter: string };
        show: { opacity: number; y: number; filter: string };
      };
    };

    expect(props.className).toBe("item-class");
    expect(props.variants.hidden).toEqual({ opacity: 0, y: 20, filter: "blur(4px)" });
    expect(props.variants.show).toMatchObject({ opacity: 1, y: 0, filter: "blur(0px)" });
  });
});
