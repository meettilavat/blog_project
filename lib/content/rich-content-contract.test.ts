import { describe, expectTypeOf, it } from "vitest";
import type { RichContentValue } from "./rich-content-contract";

describe("lib/content/rich-content-contract.ts", () => {
  it("defines the shared rich-content payload base contract", () => {
    expectTypeOf<RichContentValue>().toEqualTypeOf<Record<string, unknown> | null>();
  });
});
