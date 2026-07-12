import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/posts/post-cover-media", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />
}));

import { FigurePlate } from "../figure-plate";

describe("FigurePlate", () => {
  it("renders the figure label, caption, and corner ticks", () => {
    const html = renderToStaticMarkup(
      <FigurePlate figureLabel="Fig. 01" caption="Operations dashboard" src="/x.png" alt="Dashboard" sizes="100vw" />
    );
    expect(html).toContain("Fig. 01");
    expect(html).toContain("Operations dashboard");
    expect(html).toContain('data-corner="tl"');
    expect(html).toContain('data-corner="br"');
  });
});
