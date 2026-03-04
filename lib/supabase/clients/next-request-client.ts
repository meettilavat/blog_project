import { cookies } from "next/headers";
import {
  createSupabaseRequestClient
} from "./server-client-factory";
import type {
  ServerClientFactory,
  SupabaseServerClient
} from "../contracts/client-boundary";
import {
  loadSupabaseEnv,
  type ConfiguredSupabaseEnv
} from "../bootstrap/env";
import type { SupabaseCookieStore } from "../contracts/request-boundary";
import {
  throwSupabaseBoundaryError,
  type SupabaseBoundaryResult
} from "../errors/supabase-result";

type CreateNextSupabaseServerClientOptions = {
  access?: "read" | "write";
  cookieContext?: "strict" | "allow-missing";
  env?: ConfiguredSupabaseEnv;
  cookieProvider?: () => Promise<SupabaseCookieStore | null>;
  createServerClientImpl?: ServerClientFactory;
};

export const SUPABASE_REQUEST_CLIENT_CONTRACT_SCOPE = "lib/supabase/clients/next-request-client";
export const SUPABASE_REQUEST_CLIENT_CONTRACT_VERSION = 1 as const;

function readNextRequestCookieStore(): Promise<SupabaseCookieStore | null> {
  return Promise.resolve(cookies());
}

/**
 * Canonical Next.js adapter surface: result-returning boundary contract.
 */
export const createSupabaseServerClient = ({
  access = "read",
  cookieContext = "strict",
  env = loadSupabaseEnv(),
  cookieProvider = readNextRequestCookieStore,
  createServerClientImpl
}: CreateNextSupabaseServerClientOptions = {}): Promise<SupabaseBoundaryResult<SupabaseServerClient>> => {
  const cookieWritePolicy = access === "write" ? "read-write" : "read-only";

  return createSupabaseRequestClient({
    cookieWritePolicy,
    cookieContextPolicy: cookieContext,
    env,
    cookieProvider,
    createServerClientImpl
  });
};

export async function createSupabaseServerClientOrThrow(
  options: CreateNextSupabaseServerClientOptions = {}
): Promise<SupabaseServerClient> {
  const result = await createSupabaseServerClient(options);
  if (!result.ok) {
    throwSupabaseBoundaryError(result.error);
  }
  return result.data;
}
