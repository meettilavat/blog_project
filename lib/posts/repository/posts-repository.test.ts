import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import { CookieContextUnavailableError } from "@/lib/supabase/errors/request-client-errors";

const {
  createSupabaseServerClientOrThrowMock,
  createSupabasePublicServerClientMock
} = vi.hoisted(() => ({
  createSupabaseServerClientOrThrowMock: vi.fn(),
  createSupabasePublicServerClientMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  unstable_cache: <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) => fn
}));

vi.mock("@/lib/supabase/clients/next-request-client", () => ({
  createSupabaseServerClientOrThrow: createSupabaseServerClientOrThrowMock,
  errorMessage: (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback
}));

vi.mock("@/lib/supabase/clients/public-client", () => ({
  createSupabasePublicServerClient: createSupabasePublicServerClientMock
}));

import {
  getAllPosts,
  getPostBySlug
} from "@/lib/posts/repository/admin-posts-repository";
import {
  getPublishedPostBySlug,
  getPublishedPosts
} from "@/lib/posts/repository/public-posts-repository";

type QueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

function makeSupabasePostsClient<T>(result: QueryResult<T>) {
  const query = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result)
  };

  const select = vi.fn(() => query);
  const from = vi.fn(() => ({ select }));

  return {
    from,
    query,
    select
  };
}

describe("lib/posts/repository/*", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("maps auth/bootstrap client failures to misconfigured error for admin listing", async () => {
    createSupabaseServerClientOrThrowMock.mockRejectedValue(new SupabaseBootstrapError());

    const result = await getAllPosts();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "misconfigured",
        message: "Supabase not configured while loading posts."
      }
    });
  });

  it("keeps cross-module bootstrap failures classified by boundary error kind", async () => {
    const adminScenarios = [
      {
        run: () => getAllPosts(),
        message: "Supabase not configured while loading posts."
      },
      {
        run: () => getPostBySlug("post-slug"),
        message: "Supabase not configured while loading post."
      }
    ];

    const bootstrapFailures = [
      {
        error: new Error("Supabase environment variables are missing"),
        expected: (message: string) => ({
          kind: "misconfigured",
          message
        })
      },
      {
        error: new CookieContextUnavailableError(),
        expected: () => ({
          kind: "cookies_unavailable",
          message: "Request cookie context unavailable while loading posts."
        })
      },
      {
        error: new Error("Failed to access request cookies: permission denied"),
        expected: () => ({
          kind: "cookies_access_failed",
          message: "Failed to access request cookies: permission denied"
        })
      }
    ];

    for (const scenario of adminScenarios) {
      for (const failure of bootstrapFailures) {
        createSupabaseServerClientOrThrowMock.mockRejectedValueOnce(failure.error);
        const result = await scenario.run();
        expect(result).toEqual({
          ok: false,
          error: failure.expected(scenario.message)
        });
      }
    }
  });

  it("maps query errors to query-kind errors for admin listing", async () => {
    const client = makeSupabasePostsClient({
      data: null,
      error: { message: "permission denied" } as PostgrestError
    });
    createSupabaseServerClientOrThrowMock.mockResolvedValue(client);

    const result = await getAllPosts();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "Failed to load posts",
        cause: "permission denied"
      }
    });
  });

  it("rejects contract drift in list payloads", async () => {
    const client = makeSupabasePostsClient({
      data: [{ id: "post-1", title: "Missing required contract fields" }] as unknown as Array<{
        id: string;
      }>,
      error: null
    });
    createSupabaseServerClientOrThrowMock.mockResolvedValue(client);

    const result = await getAllPosts();

    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        message: "Post list payload failed contract validation."
      }
    });
    if (!result.ok) {
      expect(result.error.cause).toBe("slug must be a non-empty string");
    }
  });

  it("returns null for missing post detail query results", async () => {
    const client = makeSupabasePostsClient({
      data: null,
      error: null
    });
    createSupabaseServerClientOrThrowMock.mockResolvedValue(client);

    const result = await getPostBySlug("missing");

    expect(result).toEqual({
      ok: true,
      data: null
    });
  });

  it("enforces published-status filter when loading public post detail", async () => {
    const client = makeSupabasePostsClient({
      data: null,
      error: null
    });
    createSupabasePublicServerClientMock.mockReturnValue(client);

    await getPublishedPostBySlug("post-slug");

    expect(client.query.eq).toHaveBeenNthCalledWith(1, "slug", "post-slug");
    expect(client.query.eq).toHaveBeenNthCalledWith(2, "status", "published");
  });

  it("enforces published-status filter when loading public post list", async () => {
    const client = makeSupabasePostsClient({
      data: [],
      error: null
    });
    createSupabasePublicServerClientMock.mockReturnValue(client);

    await getPublishedPosts();

    expect(client.query.eq).toHaveBeenCalledWith("status", "published");
  });

  it("maps thrown query execution errors to infrastructure errors for admin listing", async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(async () => {
        throw new Error("network unavailable");
      }),
      maybeSingle: vi.fn(async () => ({ data: null, error: null }))
    };
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => query)
      }))
    };
    createSupabaseServerClientOrThrowMock.mockResolvedValue(client);

    const result = await getAllPosts();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "infrastructure",
        message: "Failed to execute post repository query.",
        cause: "network unavailable"
      }
    });
  });

  it("maps thrown query execution errors to infrastructure errors for published detail", async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(async () => ({ data: null, error: null })),
      maybeSingle: vi.fn(async () => {
        throw new Error("network unavailable");
      })
    };
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => query)
      }))
    };
    createSupabasePublicServerClientMock.mockReturnValue(client);

    const result = await getPublishedPostBySlug("slug");

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "infrastructure",
        message: "Failed to execute post repository query.",
        cause: "network unavailable"
      }
    });
  });
});
