import { createClient } from "@supabase/supabase-js";
import { type ConfiguredSupabaseEnv, loadSupabaseEnv } from "../bootstrap/env";

export type PublicClientOptions = {
  auth: {
    persistSession: boolean;
    autoRefreshToken: boolean;
    detectSessionInUrl: boolean;
  };
};

type SupabasePublicClient = ReturnType<typeof createClient>;

export type PublicClientFactory = (
  url: string,
  anonKey: string,
  options: PublicClientOptions
) => SupabasePublicClient;

type CreateSupabasePublicClientOptions = {
  env?: ConfiguredSupabaseEnv;
  createClientImpl?: PublicClientFactory;
};

function createStatelessSupabaseClient({
  env,
  createClientImpl = createClient
}: {
  env: ConfiguredSupabaseEnv;
  createClientImpl?: PublicClientFactory;
}) {
  const { url, anonKey } = env;
  return createClientImpl(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function createSupabasePublicServerClient({
  env = loadSupabaseEnv(),
  createClientImpl = createClient
}: CreateSupabasePublicClientOptions = {}) {
  return createStatelessSupabaseClient({
    env,
    createClientImpl
  });
}
