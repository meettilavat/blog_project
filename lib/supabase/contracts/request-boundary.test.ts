import { describe, expectTypeOf, it } from "vitest";
import type {
  ConfiguredSupabaseEnv,
  SupabaseCookie,
  SupabaseCookieMutation,
  SupabaseCookieStore
} from "./request-boundary";

describe("lib/supabase/contracts/request-boundary.ts", () => {
  it("defines stable Supabase environment and cookie boundary contracts", () => {
    expectTypeOf<ConfiguredSupabaseEnv>().toEqualTypeOf<{
      url: string;
      anonKey: string;
    }>();

    expectTypeOf<SupabaseCookie>().toEqualTypeOf<{
      name: string;
      value: string;
    }>();

    expectTypeOf<SupabaseCookieMutation>().toMatchTypeOf<{
      name: string;
      value: string;
      options: object;
    }>();

    expectTypeOf<SupabaseCookieStore>().toMatchTypeOf<{
      getAll: () => Array<{ name: string; value: string }>;
      set: (cookie: { name: string; value: string }) => void;
    }>();
  });
});
