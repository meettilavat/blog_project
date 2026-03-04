const NEXT_MISSING_REQUEST_SCOPE_ERROR_CODE = "E251";

function hasFrameworkErrorCode(error: unknown, expectedCode: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = Reflect.get(error, "__NEXT_ERROR_CODE");
  return typeof code === "string" && code === expectedCode;
}

export class CookieProviderAccessError extends Error {
  readonly kind = "cookies_access_failed";

  constructor(message: string) {
    super(message);
    this.name = "CookieProviderAccessError";
  }
}

export class CookieContextUnavailableError extends Error {
  readonly kind = "cookies_unavailable";

  constructor(message = "Request cookie context unavailable while creating Supabase server client.") {
    super(message);
    this.name = "CookieContextUnavailableError";
  }
}

export function isCookieContextUnavailableError(error: unknown) {
  return (
    error instanceof CookieContextUnavailableError ||
    hasFrameworkErrorCode(error, NEXT_MISSING_REQUEST_SCOPE_ERROR_CODE)
  );
}
