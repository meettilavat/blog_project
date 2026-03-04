import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientMock,
  revalidatePathMock,
  updateTagMock
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateTagMock: vi.fn()
}));

vi.mock("@/lib/supabase/clients/next-request-client", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  updateTag: updateTagMock
}));

import { deletePostAction, savePostAction } from "./post-actions";

describe("apps/admin/features/editor/server/post-actions.ts", () => {
  const savedPostRow = {
    id: "post-1",
    title: "Updated title",
    slug: "updated-title",
    excerpt: "Updated excerpt",
    content: { type: "doc", content: [] },
    cover_image_url: null,
    status: "draft" as const,
    author_id: "author-1",
    created_at: "2026-03-03T00:00:00.000Z",
    updated_at: "2026-03-04T00:00:00.000Z"
  };
  const savedPostRecord = {
    id: "post-1",
    title: "Updated title",
    slug: "updated-title",
    excerpt: "Updated excerpt",
    content: { type: "doc", content: [] },
    coverImageUrl: null,
    status: "draft" as const,
    authorId: "author-1",
    createdAt: "2026-03-03T00:00:00.000Z",
    updatedAt: "2026-03-04T00:00:00.000Z"
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("applies author ownership filter when updating an existing post", async () => {
    const singleMock = vi.fn(async () => ({ data: savedPostRow, error: null }));
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const eqAuthorMock = vi.fn(() => ({ select: selectMock }));
    const eqIdMock = vi.fn(() => ({ eq: eqAuthorMock }));
    const updateMock = vi.fn(() => ({ eq: eqIdMock }));

    createSupabaseServerClientMock.mockResolvedValue({
      ok: true,
      data: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "author-1", app_metadata: { role: "editor" } } }
        })
      },
      from: vi.fn(() => ({
        update: updateMock
      }))
      }
    });

    const result = await savePostAction({
      id: "post-1",
      title: "Updated title",
      excerpt: "Updated excerpt",
      status: "draft",
      content: {
        type: "doc",
        content: []
      }
    });

    expect(result).toEqual({
      ok: true,
      data: {
        post: savedPostRecord,
        slug: "updated-title"
      }
    });
    expect(eqIdMock).toHaveBeenCalledWith("id", "post-1");
    expect(eqAuthorMock).toHaveBeenCalledWith("author_id", "author-1");
  });

  it("applies author ownership filter when deleting a post", async () => {
    const eqAuthorMock = vi.fn(async () => ({ error: null }));
    const eqIdMock = vi.fn(() => ({ eq: eqAuthorMock }));
    const deleteMock = vi.fn(() => ({ eq: eqIdMock }));

    createSupabaseServerClientMock.mockResolvedValue({
      ok: true,
      data: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "author-1", app_metadata: { role: "editor" } } }
        })
      },
      from: vi.fn(() => ({
        delete: deleteMock
      }))
      }
    });

    const result = await deletePostAction("post-1", "updated-title");

    expect(result).toEqual({ ok: true, data: null });
    expect(eqIdMock).toHaveBeenCalledWith("id", "post-1");
    expect(eqAuthorMock).toHaveBeenCalledWith("author_id", "author-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(updateTagMock).toHaveBeenCalledWith("posts");
  });

  it("returns a permission error when user role is not editor/admin", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      ok: true,
      data: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "viewer-1", app_metadata: { role: "viewer" } } }
        })
      }
      }
    });

    const result = await savePostAction({
      id: "post-1",
      title: "Updated title",
      excerpt: "Updated excerpt",
      status: "draft",
      content: {
        type: "doc",
        content: []
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "forbidden",
        message: "You do not have permission to save posts."
      }
    });
  });

  it("normalizes Supabase bootstrap failures to a stable action error message", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      ok: false,
      error: {
        kind: "misconfigured",
        message: "Supabase environment is not configured.",
        cause: "Supabase missing"
      }
    });

    const result = await savePostAction({
      title: "Updated title",
      status: "draft",
      content: {
        type: "doc",
        content: []
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "misconfigured",
        message: "Supabase is not configured.",
        cause: "Supabase missing"
      }
    });
  });

  it("maps auth transport failures to infrastructure errors before auth-state checks", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      ok: true,
      data: {
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: { message: "Auth transport unavailable" }
          })
        }
      }
    });

    const result = await savePostAction({
      title: "Updated title",
      status: "draft",
      content: {
        type: "doc",
        content: []
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "infrastructure",
        message: "Failed to initialize post save.",
        cause: "Auth transport unavailable"
      }
    });
  });

  it("returns a contract error when the saved payload shape is invalid", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const singleMock = vi.fn(async () => ({ data: { id: "post-1" }, error: null }));
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const eqAuthorMock = vi.fn(() => ({ select: selectMock }));
    const eqIdMock = vi.fn(() => ({ eq: eqAuthorMock }));
    const updateMock = vi.fn(() => ({ eq: eqIdMock }));

    createSupabaseServerClientMock.mockResolvedValue({
      ok: true,
      data: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "author-1", app_metadata: { role: "editor" } } }
        })
      },
      from: vi.fn(() => ({
        update: updateMock
      }))
      }
    });

    const result = await savePostAction({
      id: "post-1",
      title: "Updated title",
      excerpt: "Updated excerpt",
      status: "draft",
      content: {
        type: "doc",
        content: []
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "validation",
        message: "Saved post payload failed contract validation."
      }
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("classifies post persistence failures with stable query error shape", async () => {
    const singleMock = vi.fn(async () => ({ data: null, error: { message: "row-level security blocked" } }));
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const eqAuthorMock = vi.fn(() => ({ select: selectMock }));
    const eqIdMock = vi.fn(() => ({ eq: eqAuthorMock }));
    const updateMock = vi.fn(() => ({ eq: eqIdMock }));

    createSupabaseServerClientMock.mockResolvedValue({
      ok: true,
      data: {
      auth: {
        getUser: async () => ({
          data: { user: { id: "author-1", app_metadata: { role: "editor" } } }
        })
      },
      from: vi.fn(() => ({
        update: updateMock
      }))
      }
    });

    const result = await savePostAction({
      id: "post-1",
      title: "Updated title",
      excerpt: "Updated excerpt",
      status: "draft",
      content: {
        type: "doc",
        content: []
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "Failed to save post.",
        cause: "row-level security blocked"
      }
    });
  });
});
