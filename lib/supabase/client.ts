import { createBrowserClient } from "@supabase/ssr";

type RuntimeSupabaseConfig = {
  url?: string;
  anonKey?: string;
};

function getRuntimeSupabaseConfig(): RuntimeSupabaseConfig | null {
  if (typeof window === "undefined") return null;
  const value = (window as any).__MEETTILAVAT_SUPABASE__;
  if (!value || typeof value !== "object") return null;
  return value as RuntimeSupabaseConfig;
}

function getSupabaseBrowserEnv() {
  const runtime = getRuntimeSupabaseConfig();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || runtime?.url;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || runtime?.anonKey;
  return { url, anonKey };
}

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase client unavailable. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(url, anonKey);
}
