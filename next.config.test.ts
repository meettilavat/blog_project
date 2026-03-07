import { describe, expect, it } from "vitest";
import nextConfig from "./next.config.mjs";

describe("next.config.mjs", () => {
  it("does not define app-level redirects when Vercel owns host forwarding", async () => {
    expect(nextConfig.redirects).toBeUndefined();
  });
});
