export type ActionResult<T, E = string> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: E;
    };

export function actionOk<T>(data: T): { ok: true; data: T } {
  return {
    ok: true,
    data
  };
}

export function actionError<E = string>(error: E): ActionResult<never, E> {
  return {
    ok: false,
    error
  };
}
