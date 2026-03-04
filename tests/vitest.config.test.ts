import { describe, expect, it } from "vitest";
import config from "../config/testing/vitest.config";

describe("config/testing/vitest.config.ts", () => {
  it("loads with explicit setup file wiring", () => {
    expect(config.test?.setupFiles).toContain("tests/vitest.setup.ts");
  });
});
