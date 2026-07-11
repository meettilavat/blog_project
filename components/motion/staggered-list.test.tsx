import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaggeredItem, StaggeredList } from "./staggered-list";

describe("components/motion/staggered-list.tsx", () => {
  it("renders list and items visible in server HTML", () => {
    const html = renderToStaticMarkup(
      <StaggeredList className="list-class" delay={0.3} stagger={0.12}>
        <StaggeredItem className="item-class">Item A</StaggeredItem>
      </StaggeredList>
    );

    expect(html).toContain("list-class");
    expect(html).toContain("item-class");
    expect(html).toContain("Item A");
    expect(html).not.toContain("opacity:0");
    expect(html).not.toContain("blur(");
  });
});
