import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TableOfContents } from "./table-of-contents";

describe("components/content/table-of-contents.tsx", () => {
  it("renders nothing when no headings are provided", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={[]} />);
    expect(html).toBe("");
  });

  it("renders heading links and marks the first heading active by default", () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[
          { id: "intro", text: "Introduction", level: 1 },
          { id: "details", text: "Details", level: 2 }
        ]}
        offsetTop={112}
      />
    );

    expect(html).toContain("aria-label=\"On this page\"");
    expect(html).toContain("On this page");
    expect(html).toContain("href=\"#intro\"");
    expect(html).toContain("href=\"#details\"");
    expect(html).toContain("aria-current=\"location\"");
    expect(html).not.toContain("<aside");
  });

  it("can render as a sticky rail without changing the reading column", () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[{ id: "intro", text: "Introduction", level: 1 }]}
        offsetTop={112}
        variant="rail"
      />
    );

    expect(html).toContain("<aside");
    expect(html).toContain("top:112px");
    expect(html).toContain("href=\"#intro\"");
  });

  it("contains and wraps long rail labels", () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[{
          id: "long-heading",
          text: "A deliberately long operational heading that must stay inside the marginal rail",
          level: 2
        }]}
        variant="rail"
      />
    );

    expect(html).toContain("overflow-x-hidden");
    expect(html).toContain("min-w-0");
    expect(html).toContain("break-words");
  });

  it("allows uninterrupted compact labels to wrap instead of widening the page", () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[{
          id: "long-token",
          text: "ContinuousOperationalHeadingWithoutNaturalBreaksOrSpaces",
          level: 2
        }]}
      />
    );

    expect(html).toContain("[overflow-wrap:anywhere]");
  });

  it("does not mark headings active when trackActive is disabled", () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[
          { id: "overview", text: "Overview", level: 1 },
          { id: "summary", text: "Summary", level: 2 }
        ]}
        trackActive={false}
      />
    );

    expect(html).toContain("href=\"#overview\"");
    expect(html).toContain("href=\"#summary\"");
    expect(html).not.toContain("aria-current=\"location\"");
  });
});
