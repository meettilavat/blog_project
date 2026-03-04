import { describe, expect, it } from "vitest";
import {
  createSupabaseCookieStoreDouble,
  createSupabaseTestEnv
} from "@/tests/support/supabase-testkit";
import { createServerClientCaptureHarness } from "@/tests/support/supabase-contract-harness";
import {
  runRequestContextPolicyContractMatrix,
  runRequestWritePolicyContractMatrix
} from "@/tests/support/supabase-request-client-contract";
import { createSupabaseRequestClient } from "./server-client-factory";
import { SupabaseBootstrapError } from "../bootstrap/env";

const TEST_ENV = createSupabaseTestEnv();

describe("lib/supabase/clients/server-client-factory.ts contract matrix", () => {
  it("classifies request-context policy outcomes across strict and allow-missing modes", async () => {
    await runRequestContextPolicyContractMatrix(async (scenario) => {
      const harness = createServerClientCaptureHarness({ ok: true });

      const result = await createSupabaseRequestClient({
        env: TEST_ENV,
        cookieContextPolicy: scenario.cookieContextPolicy,
        cookieProvider: scenario.cookieProvider,
        createServerClientImpl: harness.createServerClientImpl
      });

      if (result.ok) {
        return {
          ok: true as const,
          getAll: harness.readCookies()
        };
      }

      return {
        ok: false as const,
        error: result.error
      };
    });
  });

  it("enforces write-policy matrix for cookie mutation behavior", async () => {
    await runRequestWritePolicyContractMatrix(async (scenario) => {
      const cookieStore = createSupabaseCookieStoreDouble();
      const harness = createServerClientCaptureHarness({ ok: true });

      const result = await createSupabaseRequestClient({
        env: TEST_ENV,
        cookieWritePolicy: scenario.cookieWritePolicy,
        cookieProvider: async () => cookieStore,
        createServerClientImpl: harness.createServerClientImpl
      });

      if (result.ok) {
        harness.writeCookies([
          {
            name: "sb-refresh-token",
            value: "next",
            options: { path: "/" }
          }
        ]);
      }

      return {
        ok: result.ok,
        setCalls: cookieStore.__mocks.set.mock.calls.length
      };
    });
  });

  it("maps bootstrap and unexpected factory throws to stable error contracts", async () => {
    const scenarios = [
      {
        name: "bootstrap failure",
        createServerClientImpl: () => {
          throw new SupabaseBootstrapError();
        },
        expected: {
          kind: "misconfigured",
          message: "Supabase environment is not configured.",
          cause:
            "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        }
      },
      {
        name: "unexpected infrastructure failure",
        createServerClientImpl: () => {
          throw new Error("network unavailable");
        },
        expected: {
          kind: "infrastructure",
          message: "Failed to create Supabase server client.",
          cause: "network unavailable"
        }
      }
    ] as const;

    for (const scenario of scenarios) {
      const result = await createSupabaseRequestClient({
        env: TEST_ENV,
        cookieProvider: async () => createSupabaseCookieStoreDouble(),
        createServerClientImpl: scenario.createServerClientImpl
      });

      expect(result, scenario.name).toEqual({
        ok: false,
        error: scenario.expected
      });
    }
  });
});
