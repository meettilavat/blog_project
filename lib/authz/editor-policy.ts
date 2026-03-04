type EditorScopedUser = {
  id: string;
  app_metadata?: {
    role?: string;
  };
  user_metadata?: {
    role?: string;
  };
};

type AuthorizationSuccess<TUser> = {
  ok: true;
  user: TUser;
};

type AuthorizationFailure = {
  ok: false;
  status: 401 | 403;
  message: string;
};

type AuthorizationResult<TUser> = AuthorizationSuccess<TUser> | AuthorizationFailure;

type RequireEditorUserMessages = {
  unauthenticatedMessage?: string;
  forbiddenMessage?: string;
};

function normalizeRole(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function hasEditorRole(user: EditorScopedUser) {
  const roles = [user.app_metadata?.role, user.user_metadata?.role]
    .map((value) => normalizeRole(value))
    .filter((value): value is string => value !== null);
  return roles.some((role) => role === "admin" || role === "editor");
}

export function requireEditorUser(
  user: EditorScopedUser | null,
  {
    unauthenticatedMessage = "You must be signed in.",
    forbiddenMessage = "You do not have permission to perform this action."
  }: RequireEditorUserMessages = {}
): AuthorizationResult<EditorScopedUser> {
  if (!user) {
    return {
      ok: false,
      status: 401,
      message: unauthenticatedMessage
    };
  }

  if (!hasEditorRole(user)) {
    return {
      ok: false,
      status: 403,
      message: forbiddenMessage
    };
  }

  return {
    ok: true,
    user
  };
}

type OwnershipEqQuery<TQuery> = {
  eq: (column: string, value: string) => TQuery;
};

export function enforcePostOwnership<TQuery extends OwnershipEqQuery<TQuery>>(
  query: TQuery,
  userId: string
) {
  return query.eq("author_id", userId);
}
