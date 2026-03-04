import { createServerClient } from "@supabase/ssr";
import type {
  SupabaseCookieMutation,
  SupabaseCookieStore
} from "./request-boundary";

export type ServerClientOptions = {
  cookies: {
    getAll: () => Array<{ name: string; value: string }>;
    setAll: (cookiesToSet: SupabaseCookieMutation[]) => void;
  };
};

export type SupabaseServerClient = ReturnType<typeof createServerClient>;

export type ServerClientFactory = (
  url: string,
  anonKey: string,
  options: ServerClientOptions
) => SupabaseServerClient;
