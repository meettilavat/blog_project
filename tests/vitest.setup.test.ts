import { describe, expect, it } from "vitest";
import { VITEST_SETUP_LOADED } from "./vitest.setup";

describe("tests/vitest.setup.ts", () => {
  it("exports setup marker for graph discoverability", () => {
    expect(VITEST_SETUP_LOADED).toBe(true);
  });
});

