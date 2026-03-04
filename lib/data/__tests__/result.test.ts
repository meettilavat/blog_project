import { describe, expect, it } from "vitest";
import { dataError, dataOk } from "../result";

describe("lib/data/result.ts", () => {
  it("creates a successful result with payload", () => {
    expect(dataOk({ id: "post-1" })).toEqual({
      ok: true,
      data: { id: "post-1" }
    });
  });

  it("creates an error result with kind and message", () => {
    expect(dataError("query", "query failed")).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "query failed"
      }
    });
  });
});
