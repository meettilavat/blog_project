import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { wrapTextMarks } from "./rich-text-mark-renderer";

function renderMarkedText() {
  return renderToStaticMarkup(
    <>
      {wrapTextMarks(
        "Hello world",
        [
          { type: "bold" },
          { type: "italic" },
          { type: "link", attrs: { href: "/docs" } }
        ],
        "mark"
      )}
    </>
  );
}

describe("components/content/rich-text-mark-renderer.tsx", () => {
  it("wraps text with supported marks in order", () => {
    const html = renderMarkedText();
    expect(html).toContain("<a");
    expect(html).toContain("<em><strong>Hello world</strong></em>");
    expect(html).toContain("href=\"/docs\"");
    expect(html).toContain("Hello world");
  });

  it("ignores unsupported and malformed marks", () => {
    const html = renderToStaticMarkup(
      <>
        {wrapTextMarks(
          "Fallback",
          [
            { type: "noop" },
            null as never
          ],
          "mark"
        )}
      </>
    );

    expect(html).toContain("Fallback");
    expect(html).not.toContain("<a");
  });

  it("drops links with disallowed href schemes", () => {
    const html = renderToStaticMarkup(
      <>
        {wrapTextMarks(
          "Unsafe",
          [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          "mark"
        )}
      </>
    );

    expect(html).toContain("Unsafe");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("javascript:alert(1)");
  });
});
