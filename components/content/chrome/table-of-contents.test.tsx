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

    expect(html).toContain("On this page");
    expect(html).toContain("href=\"#intro\"");
    expect(html).toContain("href=\"#details\"");
    expect(html).toContain("aria-current=\"location\"");
    expect(html).toContain("top:112px");
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
