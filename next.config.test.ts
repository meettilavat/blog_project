import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";

describe("next.config.mjs", () => {
  it("keeps the apex host redirecting permanently to the www host", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/:path*",
          has: [{ type: "host", value: "meettilavat.com" }],
          destination: "https://www.meettilavat.com/:path*",
          permanent: true
        }
      ])
    );
  });
});
