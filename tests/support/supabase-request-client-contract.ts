import { expect } from "vitest";
import { createSupabaseCookieStoreDouble } from "./supabase-testkit";
import { CookieContextUnavailableError } from "@/lib/supabase/errors/request-client-errors";

const SUPABASE_COOKIE_CONTEXT_UNAVAILABLE_MESSAGE =
  "Request cookie context unavailable while creating Supabase server client.";
const SUPABASE_COOKIE_ACCESS_FAILED_MESSAGE = "Failed to access request cookies.";

type CookieContextPolicy = "strict" | "allow-missing";
type CookieWritePolicy = "read-only" | "read-write";

type CookieStoreDouble = ReturnType<typeof createSupabaseCookieStoreDouble>;
type CookieSnapshot = Array<{ name: string; value: string }>;

type RequestContextContractOutcome =
  | {
      ok: true;
      getAll: CookieSnapshot;
    }
  | {
      ok: false;
      error: {
        kind: string;
        message: string;
        cause?: string;
      };
    };

type RequestContextPolicyScenario = {
  name: string;
  cookieContextPolicy: CookieContextPolicy;
  cookieProvider: () => Promise<CookieStoreDouble | null>;
  expected: RequestContextContractOutcome;
};

function createRequestContextPolicyScenarios(): RequestContextPolicyScenario[] {
  return [
    {
      name: "strict + cookie store",
      cookieContextPolicy: "strict",
      cookieProvider: async () =>
        createSupabaseCookieStoreDouble([{ name: "sb-access-token", value: "token" }]),
      expected: {
        ok: true,
        getAll: [{ name: "sb-access-token", value: "token" }]
      }
    },
    {
      name: "strict + cookie scope throw",
      cookieContextPolicy: "strict",
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      },
      expected: {
        ok: false,
        error: {
          kind: "cookies_unavailable",
          message: SUPABASE_COOKIE_CONTEXT_UNAVAILABLE_MESSAGE,
          cause: SUPABASE_COOKIE_CONTEXT_UNAVAILABLE_MESSAGE
        }
      }
    },
    {
      name: "strict + null cookie store",
      cookieContextPolicy: "strict",
      cookieProvider: async () => null,
      expected: {
        ok: false,
        error: {
          kind: "cookies_unavailable",
          message: SUPABASE_COOKIE_CONTEXT_UNAVAILABLE_MESSAGE,
          cause: SUPABASE_COOKIE_CONTEXT_UNAVAILABLE_MESSAGE
        }
      }
    },
    {
      name: "allow-missing + cookie scope throw",
      cookieContextPolicy: "allow-missing",
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      },
      expected: {
        ok: true,
        getAll: []
      }
    },
    {
      name: "allow-missing + null cookie store",
      cookieContextPolicy: "allow-missing",
      cookieProvider: async () => null,
      expected: {
        ok: true,
        getAll: []
      }
    },
    {
      name: "strict + non-context cookie error",
      cookieContextPolicy: "strict",
      cookieProvider: async () => {
        throw new Error("permission denied");
      },
      expected: {
        ok: false,
        error: {
          kind: "cookies_access_failed",
          message: SUPABASE_COOKIE_ACCESS_FAILED_MESSAGE,
          cause: "Failed to access request cookies: permission denied"
        }
      }
    }
  ];
}

export async function runRequestContextPolicyContractMatrix(
  executeScenario: (scenario: RequestContextPolicyScenario) => Promise<RequestContextContractOutcome>
) {
  for (const scenario of createRequestContextPolicyScenarios()) {
    const outcome = await executeScenario(scenario);
    expect(outcome, scenario.name).toEqual(scenario.expected);
  }
}

type RequestWritePolicyScenario = {
  name: string;
  cookieWritePolicy: CookieWritePolicy;
  expectedSetCalls: number;
};

type RequestWritePolicyContractOutcome = {
  ok: boolean;
  setCalls: number;
};

const REQUEST_WRITE_POLICY_SCENARIOS: RequestWritePolicyScenario[] = [
  {
    name: "read-write policy",
    cookieWritePolicy: "read-write",
    expectedSetCalls: 1
  },
  {
    name: "read-only policy",
    cookieWritePolicy: "read-only",
    expectedSetCalls: 0
  }
];

export async function runRequestWritePolicyContractMatrix(
  executeScenario: (scenario: RequestWritePolicyScenario) => Promise<RequestWritePolicyContractOutcome>
) {
  for (const scenario of REQUEST_WRITE_POLICY_SCENARIOS) {
    const outcome = await executeScenario(scenario);
    expect(outcome.ok, scenario.name).toBe(true);
    expect(outcome.setCalls, scenario.name).toBe(scenario.expectedSetCalls);
  }
}
