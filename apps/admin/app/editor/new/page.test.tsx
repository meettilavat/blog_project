import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "next/navigation";

const requireAuthenticatedUserSessionMock = vi.fn();
const getDraftsForUserMock = vi.fn();
const editorFormRenderMock = vi.fn((props: { drafts: Array<{ id: string }> }) => (
  <div>{`EditorFormStub:${props.drafts.length}`}</div>
));

vi.mock("@/lib/services/current-user-service", () => ({
  requireAuthenticatedUserSession: () => requireAuthenticatedUserSessionMock()
}));

vi.mock("@/lib/data/drafts", () => ({
  getDraftsForUser: (userId: string) => getDraftsForUserMock(userId)
}));

vi.mock("@/apps/admin/features/editor/ui/editor-form", () => ({
  EditorForm: (props: { drafts: Array<{ id: string }> }) => editorFormRenderMock(props)
}));

import NewPostPage from "./page";

describe("apps/admin/app/editor/new/page.tsx", () => {
  beforeEach(() => {
    requireAuthenticatedUserSessionMock.mockReset();
    getDraftsForUserMock.mockReset();
    editorFormRenderMock.mockClear();
    vi.mocked(redirect).mockClear();
  });

  it("redirects unauthenticated users to login", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: false,
      error: { kind: "unauthenticated", message: "login required" }
    });

    await expect(NewPostPage()).rejects.toThrow("redirect:/login?redirectedFrom=/editor/new");
    expect(redirect).toHaveBeenCalledWith("/login?redirectedFrom=/editor/new");
  });

  it("throws on non-authentication session errors", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: false,
      error: { kind: "misconfigured", message: "session unavailable" }
    });

    await expect(NewPostPage()).rejects.toThrow("session unavailable");
  });

  it("throws when draft loading fails", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });
    getDraftsForUserMock.mockResolvedValue({
      ok: false,
      error: { message: "failed to load drafts" }
    });

    await expect(NewPostPage()).rejects.toThrow("failed to load drafts");
  });

  it("renders EditorForm with loaded drafts", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });
    getDraftsForUserMock.mockResolvedValue({
      ok: true,
      data: [{ id: "draft-1" }, { id: "draft-2" }]
    });

    const html = renderToStaticMarkup(await NewPostPage());

    expect(getDraftsForUserMock).toHaveBeenCalledWith("user-1");
    expect(editorFormRenderMock).toHaveBeenCalledTimes(1);
    expect(html).toContain("EditorFormStub:2");
  });
});
