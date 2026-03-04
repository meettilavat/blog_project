import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookieContextUnavailableError } from "@/lib/supabase/errors/request-client-errors";

const { createSupabaseServerClientOrThrowMock } = vi.hoisted(() => ({
  createSupabaseServerClientOrThrowMock: vi.fn()
}));

vi.mock("@/lib/supabase/clients/next-request-client", () => ({
  createSupabaseServerClientOrThrow: createSupabaseServerClientOrThrowMock
}));

import {
  DraftLoadError,
  getDraftsForUserOrThrow,
  getDraftsForUserResult
} from "../drafts";

describe("lib/data/drafts.ts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("queries draft summaries scoped to the author", async () => {
    const limit = vi.fn(async () => ({
      data: [
        {
          id: "draft-1",
          title: "Draft",
          slug: "draft",
          updated_at: "2024-01-01T00:00:00.000Z"
        }
      ],
      error: null
    }));
    const order = vi.fn(() => ({ limit }));
    const eqAuthor = vi.fn(() => ({ order }));
    const eqStatus = vi.fn(() => ({ eq: eqAuthor }));
    const select = vi.fn(() => ({ eq: eqStatus }));

    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      from: vi.fn(() => ({ select }))
    });

    const result = await getDraftsForUserResult("author-1");

    expect(eqStatus).toHaveBeenCalledWith("status", "draft");
    expect(eqAuthor).toHaveBeenCalledWith("author_id", "author-1");
    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: "draft-1",
          title: "Draft",
          slug: "draft",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      ]
    });
  });

  it("returns stable query-kind errors with cause details", async () => {
    const limit = vi.fn(async () => ({ data: null, error: { message: "permission denied" } }));
    const order = vi.fn(() => ({ limit }));
    const eqAuthor = vi.fn(() => ({ order }));
    const eqStatus = vi.fn(() => ({ eq: eqAuthor }));
    const select = vi.fn(() => ({ eq: eqStatus }));

    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      from: vi.fn(() => ({ select }))
    });

    const result = await getDraftsForUserResult("author-1");

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "Failed to load drafts.",
        cause: "permission denied"
      }
    });
  });

  it("maps bootstrap failures through shared Supabase boundary classification", async () => {
    createSupabaseServerClientOrThrowMock.mockRejectedValue(new Error("Supabase missing"));

    const result = await getDraftsForUserResult("author-1");

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "misconfigured",
        message: "Supabase not configured while loading drafts."
      }
    });
  });

  it("returns validation errors with parser cause details", async () => {
    const limit = vi.fn(async () => ({
      data: [{ id: "draft-1", title: "Draft" }],
      error: null
    }));
    const order = vi.fn(() => ({ limit }));
    const eqAuthor = vi.fn(() => ({ order }));
    const eqStatus = vi.fn(() => ({ eq: eqAuthor }));
    const select = vi.fn(() => ({ eq: eqStatus }));

    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      from: vi.fn(() => ({ select }))
    });

    const result = await getDraftsForUserResult("author-1");

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "validation",
        message: "Draft payload failed contract validation.",
        cause: "slug must be a non-empty string"
      }
    });
  });

  it("exposes an explicit throw adapter for callers that require exception flow", async () => {
    createSupabaseServerClientOrThrowMock.mockRejectedValue(new CookieContextUnavailableError());

    await expect(getDraftsForUserOrThrow("author-1")).rejects.toMatchObject<DraftLoadError>({
      name: "DraftLoadError",
      kind: "cookies_unavailable",
      message: "Request cookie context unavailable while loading drafts."
    });
  });
});
