import type { CookieOptions } from "@supabase/ssr";
import { vi } from "vitest";
import type { SupabaseCookieStore } from "@/lib/supabase/contracts/request-boundary";

export function createSupabaseCookieStoreDouble(
  cookies: Array<{ name: string; value: string }> = []
) {
  const seededCookies = cookies.map(({ name, value }) => ({
    name,
    value
  }));
  const getAll = vi.fn(() => seededCookies.map(({ name, value }) => ({ name, value })));
  const set = vi.fn((_cookie: { name: string; value: string } & CookieOptions) => {});

  return {
    getAll,
    set,
    __mocks: {
      getAll,
      set
    }
  } satisfies SupabaseCookieStore & {
    __mocks: {
      getAll: typeof getAll;
      set: typeof set;
    };
  };
}
