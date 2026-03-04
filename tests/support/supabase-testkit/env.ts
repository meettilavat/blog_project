import type { ConfiguredSupabaseEnv } from "@/lib/supabase/contracts/request-boundary";

const HTTPS_PROTOCOL = "https:";
const SUPABASE_HOST = "example.supabase.co";
const SUPABASE_URL = `${HTTPS_PROTOCOL}//${SUPABASE_HOST}`;
const SUPABASE_ANON_KEY = "anon-key";

export const DEFAULT_ROUTE_UPLOAD_PATH = "inline/1700000000000-photo.png";
export const DEFAULT_ROUTE_UPLOAD_URL_ORIGIN = `${HTTPS_PROTOCOL}//cdn.example.com`;

export type SupabaseError = {
  message: string;
};

export function createSupabaseTestEnv(): ConfiguredSupabaseEnv {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };
}
