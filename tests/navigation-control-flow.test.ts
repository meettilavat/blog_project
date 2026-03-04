import { describe, expect, it } from "vitest";
import {
  createNotFoundControlFlowError,
  createRedirectControlFlowError,
  NavigationControlFlowError
} from "./navigation-control-flow";

describe("tests/navigation-control-flow.ts", () => {
  it("creates redirect control-flow errors with framework-like code and target", () => {
    const error = createRedirectControlFlowError("/dashboard");

    expect(error).toBeInstanceOf(NavigationControlFlowError);
    expect(error).toMatchObject({
      code: "NEXT_REDIRECT",
      target: "/dashboard",
      message: "redirect:/dashboard"
    });
  });

  it("creates notFound control-flow errors with dedicated code", () => {
    const error = createNotFoundControlFlowError();

    expect(error).toBeInstanceOf(NavigationControlFlowError);
    expect(error).toMatchObject({
      code: "NEXT_NOT_FOUND",
      target: null,
      message: "notFound"
    });
  });
});
