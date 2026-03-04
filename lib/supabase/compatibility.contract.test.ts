import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as nextRequestClientModule from "./clients/next-request-client";

describe("lib/supabase compatibility contract", () => {
  it("keeps request-client access on canonical clients entrypoint with no outer shim", () => {
    const legacyShimPath = resolve(process.cwd(), "lib/supabase/next-request-client.ts");
    expect(existsSync(legacyShimPath)).toBe(false);
    expect(typeof nextRequestClientModule.createSupabaseServerClient).toBe("function");
    expect(nextRequestClientModule.SUPABASE_REQUEST_CLIENT_CONTRACT_SCOPE).toBe(
      "lib/supabase/clients/next-request-client"
    );
    expect(nextRequestClientModule.SUPABASE_REQUEST_CLIENT_CONTRACT_VERSION).toBe(1);
    expect("default" in nextRequestClientModule).toBe(false);
  });
});
