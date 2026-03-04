import type { CookieOptions } from "@supabase/ssr";

export type ConfiguredSupabaseEnv = {
  url: string;
  anonKey: string;
};

export type SupabaseCookie = {
  name: string;
  value: string;
};

export type SupabaseCookieMutation = SupabaseCookie & {
  options: CookieOptions;
};

export type SupabaseCookieStore = {
  getAll: () => SupabaseCookie[];
  set: (cookie: SupabaseCookie & CookieOptions) => void;
};
