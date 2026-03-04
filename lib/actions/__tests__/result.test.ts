import { describe, expect, it } from "vitest";
import { actionError, actionOk } from "../result";

describe("lib/actions/result.ts", () => {
  it("builds success and error action results", () => {
    expect(actionOk({ id: "post-1" })).toEqual({
      ok: true,
      data: { id: "post-1" }
    });

    expect(actionError("permission denied")).toEqual({
      ok: false,
      error: "permission denied"
    });
  });
});
