import type { User } from "@supabase/supabase-js";
import {
  getCurrentUserResult,
  type CurrentUserError,
  type CurrentUserErrorKind
} from "@/lib/auth/current-user";

type CurrentUserSessionResult = Awaited<ReturnType<typeof getCurrentUserResult>>;

export function getOptionalCurrentUserSession(): Promise<CurrentUserSessionResult> {
  return getCurrentUserResult();
}

type UnauthenticatedError = {
  kind: "unauthenticated";
  message: string;
};

type AuthenticatedUserSessionResult =
  | {
      ok: true;
      user: User;
    }
  | {
      ok: false;
      error: CurrentUserError | UnauthenticatedError;
    };

type AuthenticatedUserErrorKind = CurrentUserErrorKind | "unauthenticated";

async function requireAuthenticatedUserSessionFrom({
  loadSession,
  unauthenticatedMessage = "You must be signed in."
}: {
  loadSession: () => Promise<CurrentUserSessionResult>;
  unauthenticatedMessage?: string;
}): Promise<AuthenticatedUserSessionResult> {
  const session = await loadSession();
  if (!session.ok) {
    return session;
  }

  if (!session.user) {
    return {
      ok: false,
      error: {
        kind: "unauthenticated",
        message: unauthenticatedMessage
      }
    };
  }

  return {
    ok: true,
    user: session.user
  };
}

export function createRequireAuthenticatedUserSession(
  loadSession: () => Promise<CurrentUserSessionResult> = getOptionalCurrentUserSession
) {
  return function requireAuthenticatedUserSession({
    unauthenticatedMessage = "You must be signed in."
  }: {
    unauthenticatedMessage?: string;
  } = {}): Promise<AuthenticatedUserSessionResult> {
    return requireAuthenticatedUserSessionFrom({
      loadSession,
      unauthenticatedMessage
    });
  };
}

export const requireAuthenticatedUserSession = createRequireAuthenticatedUserSession();
