import { dataError, type DataResult } from "@/lib/data/result";

export type SupabaseBoundaryErrorKind =
  | "misconfigured"
  | "cookies_unavailable"
  | "cookies_access_failed"
  | "infrastructure";

export type SupabaseBoundaryResult<T> = DataResult<T, SupabaseBoundaryErrorKind>;

type SupabaseBoundaryError = Extract<SupabaseBoundaryResult<never>, { ok: false }>["error"];

export class SupabaseBoundaryContractError extends Error {
  readonly kind: SupabaseBoundaryErrorKind;
  readonly causeDetail?: string;

  constructor(error: SupabaseBoundaryError) {
    const message =
      error.kind === "cookies_access_failed"
        ? error.cause ?? error.message
        : error.message;
    super(message, error.cause ? { cause: new Error(error.cause) } : undefined);
    this.name = "SupabaseBoundaryContractError";
    this.kind = error.kind;
    this.causeDetail = error.cause;
  }
}

export function supabaseBoundaryError(
  kind: SupabaseBoundaryErrorKind,
  message: string,
  cause?: string
): SupabaseBoundaryResult<never> {
  return dataError(kind, message, cause);
}

export function throwSupabaseBoundaryError(error: SupabaseBoundaryError): never {
  throw new SupabaseBoundaryContractError(error);
}
