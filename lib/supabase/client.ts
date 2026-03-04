import { createBrowserClient } from "@supabase/ssr";
import { loadSupabaseEnv } from "./bootstrap/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = loadSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
