import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientOrThrowMock,
  revalidatePathMock,
  updateTagMock
} = vi.hoisted(() => ({
  createSupabaseServerClientOrThrowMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateTagMock: vi.fn()
}));

vi.mock("@/lib/supabase/clients/next-request-client", () => ({
  createSupabaseServerClientOrThrow: createSupabaseServerClientOrThrowMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  updateTag: updateTagMock
}));

import { updateStatusAction } from "../status";

describe("lib/actions/status.ts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("applies author ownership filter when updating post status", async () => {
    const eqAuthorMock = vi.fn(async () => ({ error: null }));
    const eqIdMock = vi.fn(() => ({ eq: eqAuthorMock }));
    const updateMock = vi.fn(() => ({ eq: eqIdMock }));

    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "author-1", app_metadata: { role: "editor" } } }
        })
      },
      from: vi.fn(() => ({
        update: updateMock
      }))
    });

    const result = await updateStatusAction("post-1", "published");

    expect(result).toEqual({ ok: true, data: null });
    expect(eqIdMock).toHaveBeenCalledWith("id", "post-1");
    expect(eqAuthorMock).toHaveBeenCalledWith("author_id", "author-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(updateTagMock).toHaveBeenCalledWith("posts");
  });

  it("returns an auth error result when no user is present", async () => {
    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } })
      }
    });

    const result = await updateStatusAction("post-1", "draft");

    expect(result).toEqual({
      ok: false,
      error: "You must be signed in to update post status."
    });
  });

  it("returns a permission error result when user lacks editor role", async () => {
    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "viewer-1", app_metadata: { role: "viewer" } } }
        })
      }
    });

    const result = await updateStatusAction("post-1", "draft");

    expect(result).toEqual({
      ok: false,
      error: "You do not have permission to update post status."
    });
  });
});
