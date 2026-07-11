import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PublicNotFound from "./not-found";

describe("apps/public/app/not-found.tsx", () => {
  it("offers routes back to writing and the resume", () => {
    const html = renderToStaticMarkup(<PublicNotFound />);

    expect(html).toContain("Page not found");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/resume"');
    expect(html).toContain('data-public-status-notice="true"');
    expect(html).toContain("border-y");
    expect(html).toContain("my-auto");
    expect(html).not.toContain("rounded-[2rem]");
    expect(html).not.toContain("shadow-soft");
  });
});
