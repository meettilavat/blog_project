type NavigationControlFlowCode = "NEXT_REDIRECT" | "NEXT_NOT_FOUND";

export class NavigationControlFlowError extends Error {
  readonly code: NavigationControlFlowCode;
  readonly target: string | null;

  constructor(code: NavigationControlFlowCode, target: string | null) {
    super(code === "NEXT_REDIRECT" ? `redirect:${target ?? ""}` : "notFound");
    this.name = "NavigationControlFlowError";
    this.code = code;
    this.target = target;
  }
}

export function createRedirectControlFlowError(target: string) {
  return new NavigationControlFlowError("NEXT_REDIRECT", target);
}

export function createNotFoundControlFlowError() {
  return new NavigationControlFlowError("NEXT_NOT_FOUND", null);
}
