import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PublicError, { retryPublicRoute } from "./error";

describe("apps/public/app/error.tsx", () => {
  it("renders a retry-oriented public error state", () => {
    const html = renderToStaticMarkup(
      <PublicError error={new Error("boom")} reset={() => undefined} />
    );

    expect(html).toContain("Something interrupted this page");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
  });

  it("runs the route reset callback", () => {
    const reset = vi.fn();

    retryPublicRoute(reset);

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
