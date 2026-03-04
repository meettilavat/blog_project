import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { notFound, redirect } from "next/navigation";

const requireAuthenticatedUserSessionMock = vi.fn();
const getPostBySlugMock = vi.fn();
const getDraftsForUserMock = vi.fn();
const editorFormRenderMock = vi.fn(
  (props: { initialPost: { id: string }; drafts: Array<{ id: string }> }) => (
    <div>{`EditorFormStub:${props.initialPost.id}:${props.drafts.length}`}</div>
  )
);

vi.mock("@/lib/services/current-user-service", () => ({
  requireAuthenticatedUserSession: () => requireAuthenticatedUserSessionMock()
}));

vi.mock("@/lib/posts/repository/admin-posts-repository", () => ({
  getPostBySlug: (slug: string) => getPostBySlugMock(slug)
}));

vi.mock("@/lib/data/drafts", () => ({
  getDraftsForUser: (userId: string) => getDraftsForUserMock(userId)
}));

vi.mock("@/apps/admin/features/editor/ui/editor-form", () => ({
  EditorForm: (props: { initialPost: { id: string }; drafts: Array<{ id: string }> }) =>
    editorFormRenderMock(props)
}));

import EditPostPage from "./page";

describe("apps/admin/app/editor/[slug]/page.tsx", () => {
  beforeEach(() => {
    requireAuthenticatedUserSessionMock.mockReset();
    getPostBySlugMock.mockReset();
    getDraftsForUserMock.mockReset();
    editorFormRenderMock.mockClear();
    vi.mocked(redirect).mockClear();
    vi.mocked(notFound).mockClear();
  });

  it("redirects unauthenticated users to login with the current slug", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: false,
      error: { kind: "unauthenticated", message: "login required" }
    });

    await expect(
      EditPostPage({
        params: Promise.resolve({ slug: "hello-world" })
      })
    ).rejects.toThrow("redirect:/login?redirectedFrom=/editor/hello-world");

    expect(redirect).toHaveBeenCalledWith("/login?redirectedFrom=/editor/hello-world");
  });

  it("throws on non-auth session failures", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: false,
      error: { kind: "misconfigured", message: "session unavailable" }
    });

    await expect(
      EditPostPage({
        params: Promise.resolve({ slug: "hello-world" })
      })
    ).rejects.toThrow("session unavailable");
  });

  it("throws when post lookup fails", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });
    getPostBySlugMock.mockResolvedValue({
      ok: false,
      error: { message: "failed to load post" }
    });
    getDraftsForUserMock.mockResolvedValue({
      ok: true,
      data: []
    });

    await expect(
      EditPostPage({
        params: Promise.resolve({ slug: "hello-world" })
      })
    ).rejects.toThrow("failed to load post");
  });

  it("calls notFound when the post record does not exist", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });
    getPostBySlugMock.mockResolvedValue({
      ok: true,
      data: null
    });
    getDraftsForUserMock.mockResolvedValue({
      ok: true,
      data: []
    });

    await expect(
      EditPostPage({
        params: Promise.resolve({ slug: "missing-post" })
      })
    ).rejects.toThrow("notFound");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders EditorForm when post and drafts load successfully", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });
    getPostBySlugMock.mockResolvedValue({
      ok: true,
      data: { id: "post-1", slug: "hello-world" }
    });
    getDraftsForUserMock.mockResolvedValue({
      ok: true,
      data: [{ id: "draft-1" }, { id: "draft-2" }]
    });

    const html = renderToStaticMarkup(
      await EditPostPage({
        params: Promise.resolve({ slug: "hello-world" })
      })
    );

    expect(getPostBySlugMock).toHaveBeenCalledWith("hello-world");
    expect(getDraftsForUserMock).toHaveBeenCalledWith("user-1");
    expect(editorFormRenderMock).toHaveBeenCalledTimes(1);
    expect(html).toContain("EditorFormStub:post-1:2");
  });
});
