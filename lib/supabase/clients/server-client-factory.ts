import { createServerClient } from "@supabase/ssr";
import { dataOk } from "@/lib/data/result";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import { resolveErrorPolicy } from "@/lib/supabase/errors/error-policy";
import {
  CookieContextUnavailableError,
  CookieProviderAccessError,
  isCookieContextUnavailableError
} from "@/lib/supabase/errors/request-client-errors";
import {
  supabaseBoundaryError,
  type SupabaseBoundaryResult
} from "../errors/supabase-result";
import type {
  ServerClientFactory,
  SupabaseServerClient
} from "../contracts/client-boundary";
import type {
  ConfiguredSupabaseEnv,
  SupabaseCookieMutation,
  SupabaseCookieStore
} from "../contracts/request-boundary";

const SUPABASE_REQUEST_CLIENT_ERRORS = {
  misconfigured: "Supabase environment is not configured.",
  cookiesUnavailable: "Request cookie context unavailable while creating Supabase server client.",
  cookiesAccessFailed: "Failed to access request cookies.",
  infrastructure: "Failed to create Supabase server client."
} as const;

const SUPABASE_MISCONFIGURATION_PATTERNS = [
  "supabase environment variables are missing",
  "supabase missing",
  "supabase is not configured",
  "supabase not configured"
];

function isSupabaseMisconfigurationError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const kind = Reflect.get(error, "kind");
    const name = Reflect.get(error, "name");
    if (kind === "missing_env" || name === "SupabaseBootstrapError") {
      return true;
    }
  }

  const message = getErrorMessage(error, "").toLowerCase();
  return SUPABASE_MISCONFIGURATION_PATTERNS.some((pattern) => message.includes(pattern));
}

type SupabaseRequestClientErrorPolicy = typeof SUPABASE_REQUEST_CLIENT_ERRORS;
type SupabaseRequestClientErrorPolicyOverrides = Partial<SupabaseRequestClientErrorPolicy>;

function createSupabaseRequestClientErrorPolicy(
  overrides?: SupabaseRequestClientErrorPolicyOverrides
): SupabaseRequestClientErrorPolicy {
  return resolveErrorPolicy(SUPABASE_REQUEST_CLIENT_ERRORS, overrides);
}

type CreateSupabaseRequestClientOptions = {
  cookieWritePolicy?: "read-only" | "read-write";
  cookieContextPolicy?: "strict" | "allow-missing";
  errorPolicyOverrides?: SupabaseRequestClientErrorPolicyOverrides;
  env: ConfiguredSupabaseEnv;
  cookieProvider: () => Promise<SupabaseCookieStore | null>;
  createServerClientImpl?: ServerClientFactory;
};

async function createSupabaseRequestClientOrThrow({
  cookieWritePolicy = "read-only",
  cookieContextPolicy = "strict",
  env,
  cookieProvider,
  createServerClientImpl = createServerClient
}: CreateSupabaseRequestClientOptions) {
  const allowWrite = cookieWritePolicy === "read-write";
  const allowMissingCookieContext = cookieContextPolicy === "allow-missing";
  const { url, anonKey } = env;
  let cookieStore: SupabaseCookieStore | null = null;
  try {
    cookieStore = await cookieProvider();
  } catch (error) {
    if (isCookieContextUnavailableError(error)) {
      if (allowMissingCookieContext) {
        cookieStore = null;
      } else {
        throw new CookieContextUnavailableError();
      }
    } else {
      throw new CookieProviderAccessError(
        `Failed to access request cookies: ${getErrorMessage(error, "unknown error")}`
      );
    }
  }

  if (!cookieStore && !allowMissingCookieContext) {
    throw new CookieContextUnavailableError();
  }

  return createServerClientImpl(url, anonKey, {
    cookies: {
      getAll() {
        return (
          cookieStore?.getAll().map(({ name, value }) => ({
            name,
            value
          })) ?? []
        );
      },
      setAll(cookiesToSet: SupabaseCookieMutation[]) {
        if (!allowWrite || !cookieStore) {
          return;
        }
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set({
            name,
            value,
            ...options
          });
        }
      }
    }
  });
}

export async function createSupabaseRequestClient(
  options: CreateSupabaseRequestClientOptions
): Promise<SupabaseBoundaryResult<SupabaseServerClient>> {
  const errorPolicy = createSupabaseRequestClientErrorPolicy(options.errorPolicyOverrides);

  try {
    return dataOk(await createSupabaseRequestClientOrThrow(options));
  } catch (error) {
    if (isSupabaseMisconfigurationError(error)) {
      return supabaseBoundaryError(
        "misconfigured",
        errorPolicy.misconfigured,
        getErrorMessage(error, "unknown misconfiguration error")
      );
    }

    if (isCookieContextUnavailableError(error)) {
      return supabaseBoundaryError(
        "cookies_unavailable",
        errorPolicy.cookiesUnavailable,
        getErrorMessage(error, "unknown error")
      );
    }

    if (error instanceof CookieProviderAccessError) {
      return supabaseBoundaryError(
        "cookies_access_failed",
        errorPolicy.cookiesAccessFailed,
        error.message
      );
    }

    return supabaseBoundaryError(
      "infrastructure",
      errorPolicy.infrastructure,
      getErrorMessage(error, "unknown error")
    );
  }
}
