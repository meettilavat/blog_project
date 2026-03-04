import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import {
  currentUserQueryError,
  toCurrentUserBoundaryError,
  type CurrentUserError,
  type CurrentUserErrorKind
} from "@/lib/auth/current-user-error";

export type { CurrentUserError, CurrentUserErrorKind } from "@/lib/auth/current-user-error";

type CurrentUserResult =
  | {
      ok: true;
      user: User | null;
    }
  | {
      ok: false;
      error: CurrentUserError;
    };

export class CurrentUserLoadError extends Error {
  readonly kind: CurrentUserErrorKind;

  constructor(error: CurrentUserError) {
    super(error.message);
    this.name = "CurrentUserLoadError";
    this.kind = error.kind;
  }
}

type AuthClientLike = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: User | null;
      } | null;
      error: {
        message: string;
      } | null;
    }>;
  };
};

export async function getCurrentUserResultWith({
  loadClient
}: {
  loadClient: () => Promise<AuthClientLike>;
}): Promise<CurrentUserResult> {
  try {
    const supabase = await loadClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return {
        ok: false,
        error: currentUserQueryError(error.message)
      };
    }
    return {
      ok: true,
      user: data?.user ?? null
    };
  } catch (error) {
    return {
      ok: false,
      error: toCurrentUserBoundaryError(error)
    };
  }
}

export async function getCurrentUserResult() {
  const result = await getCurrentUserResultWith({
    loadClient: () => createSupabaseServerClientOrThrow()
  });
  if (!result.ok) {
    console.error("Failed to load current user", result.error.message);
  }
  return result;
}

export async function getCurrentUserOrThrowWith({
  loadClient
}: {
  loadClient: () => Promise<AuthClientLike>;
}) {
  const result = await getCurrentUserResultWith({
    loadClient
  });
  if (!result.ok) {
    throw new CurrentUserLoadError(result.error);
  }
  return result.user;
}
