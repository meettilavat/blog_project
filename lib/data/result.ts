export type DataAccessError<TKind extends string = string> = {
  kind: TKind;
  message: string;
  cause?: string;
};

export type DataResult<T, TKind extends string = string> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: DataAccessError<TKind>;
    };

export function dataOk<T>(data: T): { ok: true; data: T } {
  return {
    ok: true,
    data
  };
}

export function dataError<TKind extends string>(
  kind: TKind,
  message: string,
  cause?: string
): DataResult<never, TKind> {
  return {
    ok: false,
    error: cause
      ? {
          kind,
          message,
          cause
        }
      : {
          kind,
          message
        }
  };
}
