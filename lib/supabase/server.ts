import { createServerClient } from "@supabase/ssr";
import path from "path";
import env from "@next/env";
import { cookies } from "next/headers";

function ensureEnv() {
  const hasEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasEnv) return;

  const { loadEnvConfig } = env as { loadEnvConfig: (dir: string) => void };
  // Try current working directory and a couple parent levels (public/admin apps vs root).
  const cwd = process.cwd();
  loadEnvConfig(cwd);
  loadEnvConfig(path.resolve(cwd, ".."));
  loadEnvConfig(path.resolve(cwd, "../.."));
}

function getSupabaseEnv() {
  ensureEnv();
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

export async function createSupabaseServerClient(allowWrite = false) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // cookies() is unavailable during build-time metadata generation.
    cookieStore = null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        if (allowWrite && cookieStore) {
          cookieStore.set({ name, value, ...options });
        }
      },
      remove(name: string, options: any) {
        if (allowWrite && cookieStore) {
          cookieStore.delete({ name, ...options });
        }
      }
    }
  });
}

export async function getCurrentSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Unable to fetch Supabase session", error.message);
  }
  return data?.session ?? null;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
