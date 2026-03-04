import { describe, expect, it, vi } from "vitest";
import { dataError, dataOk, type DataResult } from "@/lib/data/result";
import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import { CookieContextUnavailableError } from "@/lib/supabase/errors/request-client-errors";
import {
  executePostQuery,
  POST_DETAIL_SELECT,
  POST_LIST_SELECT,
  parsePostListQueryResult,
  parsePostRecordQueryResult
} from "./post-query";

const POST_QUERY_MESSAGE = "Failed to load posts";
const POST_QUERY_ERROR_POLICY_OVERRIDES = {
  misconfigured: "Supabase not configured while loading posts."
} as const;

function createLoggerDouble() {
  return {
    error: vi.fn(),
    warn: vi.fn()
  };
}

function parseProjection(value: string) {
  return value
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

describe("lib/posts/repository/post-query.ts contract matrix", () => {
  it("locks list/detail select projections to canonical column contracts", () => {
    expect(parseProjection(POST_LIST_SELECT)).toEqual([
      "id",
      "title",
      "slug",
      "excerpt",
      "cover_image_url",
      "status",
      "created_at",
      "updated_at"
    ]);

    expect(parseProjection(POST_DETAIL_SELECT)).toEqual([
      "id",
      "title",
      "slug",
      "excerpt",
      "content",
      "cover_image_url",
      "status",
      "author_id",
      "created_at",
      "updated_at"
    ]);
  });

  it("maps query execution matrix to stable DataResult contracts", async () => {
    const logger = createLoggerDouble();
    const scenarios: Array<{
      name: string;
      run: () => Promise<{ data: unknown; error: { message: string } | null }>;
      expected: DataResult<unknown | null>;
    }> = [
      {
        name: "success payload",
        run: async () => ({ data: { id: "post-1" }, error: null }),
        expected: dataOk({ id: "post-1" })
      },
      {
        name: "query error",
        run: async () => ({ data: null, error: { message: "permission denied" } }),
        expected: dataError("query", "Failed to load posts", "permission denied")
      },
      {
        name: "misconfigured bootstrap throw",
        run: async () => {
          throw new SupabaseBootstrapError();
        },
        expected: dataError("misconfigured", "Supabase not configured while loading posts.")
      },
      {
        name: "cookie scope throw",
        run: async () => {
          throw new CookieContextUnavailableError();
        },
        expected: dataError(
          "cookies_unavailable",
          "Request cookie context unavailable while loading posts."
        )
      },
      {
        name: "cookie access throw",
        run: async () => {
          throw new Error("Failed to access request cookies: permission denied");
        },
        expected: dataError("cookies_access_failed", "Failed to access request cookies: permission denied")
      },
      {
        name: "unexpected infrastructure throw",
        run: async () => {
          throw new Error("network unavailable");
        },
        expected: dataError("infrastructure", "Failed to execute post repository query.", "network unavailable")
      }
    ];

    for (const scenario of scenarios) {
      const result = await executePostQuery({
        run: scenario.run,
        query: POST_QUERY_MESSAGE,
        errorPolicyOverrides: POST_QUERY_ERROR_POLICY_OVERRIDES,
        logger
      });

      expect(result, scenario.name).toEqual(scenario.expected);
    }
  });

  it("maps list parsing matrix to pass-through/validation contracts", () => {
    const logger = createLoggerDouble();
    const passthrough: DataResult<unknown[] | null> = dataError("query", "Failed to load posts", "permission denied");
    const validPayload: DataResult<unknown[] | null> = dataOk([
      {
        id: "post-1",
        title: "Title",
        slug: "title",
        excerpt: null,
        cover_image_url: null,
        status: "draft",
        created_at: "2026-03-01T00:00:00.000Z",
        updated_at: "2026-03-02T00:00:00.000Z"
      }
    ]);
    const invalidPayload: DataResult<unknown[] | null> = dataOk([{ id: "post-2", title: "Missing fields" }]);

    const scenarios = [
      {
        name: "error pass-through",
        input: passthrough,
        expected: passthrough
      },
      {
        name: "valid parse",
        input: validPayload,
        expected: dataOk([
          {
            id: "post-1",
            title: "Title",
            slug: "title",
            excerpt: null,
            coverImageUrl: null,
            status: "draft",
            createdAt: "2026-03-01T00:00:00.000Z",
            updatedAt: "2026-03-02T00:00:00.000Z"
          }
        ])
      },
      {
        name: "invalid parse",
        input: invalidPayload,
        expected: dataError(
          "validation",
          "Post list payload failed contract validation.",
          "slug must be a non-empty string"
        )
      }
    ];

    for (const scenario of scenarios) {
      const result = parsePostListQueryResult({
        result: scenario.input,
        invalidPayloadMessage: "Post list payload failed contract validation.",
        logger
      });

      expect(result, scenario.name).toEqual(scenario.expected);
    }
  });

  it("maps detail parsing matrix to pass-through/null/validation contracts", () => {
    const logger = createLoggerDouble();
    const passthrough: DataResult<unknown | null> = dataError("query", "Failed to load post", "permission denied");
    const validPayload: DataResult<unknown | null> = dataOk({
      id: "post-1",
      title: "Title",
      slug: "title",
      excerpt: null,
      content: null,
      cover_image_url: null,
      status: "draft",
      author_id: "author-1",
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-02T00:00:00.000Z"
    });
    const invalidPayload: DataResult<unknown | null> = dataOk({ id: "post-1", title: "Missing fields" });

    const scenarios = [
      {
        name: "error pass-through",
        input: passthrough,
        expected: passthrough
      },
      {
        name: "null payload",
        input: dataOk(null),
        expected: dataOk(null)
      },
      {
        name: "valid parse",
        input: validPayload,
        expected: dataOk({
          id: "post-1",
          title: "Title",
          slug: "title",
          excerpt: null,
          content: null,
          coverImageUrl: null,
          status: "draft",
          authorId: "author-1",
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-02T00:00:00.000Z"
        })
      },
      {
        name: "invalid parse",
        input: invalidPayload,
        expected: dataError(
          "validation",
          "Post payload failed contract validation.",
          "slug must be a non-empty string"
        )
      }
    ];

    for (const scenario of scenarios) {
      const result = parsePostRecordQueryResult({
        result: scenario.input,
        invalidPayloadMessage: "Post payload failed contract validation.",
        logger
      });

      expect(result, scenario.name).toEqual(scenario.expected);
    }
  });
});
