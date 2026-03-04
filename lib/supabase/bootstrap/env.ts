import type { ConfiguredSupabaseEnv } from "../contracts/request-boundary";

type SupabaseEnvInput = {
  url?: string;
  anonKey?: string;
};

export type { ConfiguredSupabaseEnv } from "../contracts/request-boundary";

function getSupabaseEnvInput(): SupabaseEnvInput {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

export class SupabaseBootstrapError extends Error {
  readonly kind = "missing_env";

  constructor() {
    super(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    this.name = "SupabaseBootstrapError";
  }
}

function requireSupabaseEnv(env: SupabaseEnvInput): ConfiguredSupabaseEnv {
  const { url, anonKey } = env;
  if (!url || !anonKey) {
    throw new SupabaseBootstrapError();
  }
  return {
    url,
    anonKey
  };
}

export function loadSupabaseEnv(env: SupabaseEnvInput = getSupabaseEnvInput()): ConfiguredSupabaseEnv {
  return requireSupabaseEnv(env);
}
