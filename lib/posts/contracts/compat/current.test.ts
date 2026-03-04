import { describe, expectTypeOf, it } from "vitest";
import type { PostRecord } from "../domain/types";
import type { PostRecordCurrent } from "./current";

describe("lib/posts/contracts/compat/current.ts", () => {
  it("keeps the current alias pinned to the active domain post record", () => {
    expectTypeOf<PostRecordCurrent>().toEqualTypeOf<PostRecord>();
  });
});
