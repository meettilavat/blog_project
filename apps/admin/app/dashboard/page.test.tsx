import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "next/navigation";

const requireAuthenticatedUserSessionMock = vi.fn();
const getAllPostsMock = vi.fn();
const filterBarRenderMock = vi.fn((props: { posts: unknown[] }) => (
  <div>{`FilteredDashboardListStub:${props.posts.length}`}</div>
));

vi.mock("@/lib/services/current-user-service", () => ({
  requireAuthenticatedUserSession: () => requireAuthenticatedUserSessionMock()
}));

vi.mock("@/lib/posts/repository/admin-posts-repository", () => ({
  getAllPosts: () => getAllPostsMock()
}));

vi.mock("@/components/dashboard/filter-bar", () => ({
  default: (props: { posts: unknown[] }) => filterBarRenderMock(props)
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: string }) => <button>{children}</button>
}));

import DashboardPage from "./page";

describe("apps/admin/app/dashboard/page.tsx", () => {
  beforeEach(() => {
    requireAuthenticatedUserSessionMock.mockReset();
    getAllPostsMock.mockReset();
    filterBarRenderMock.mockClear();
    vi.mocked(redirect).mockClear();
  });

  it("redirects unauthenticated users to login", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: false,
      error: { kind: "unauthenticated", message: "login required" }
    });

    await expect(DashboardPage()).rejects.toThrow("redirect:/login?redirectedFrom=/dashboard");
    expect(redirect).toHaveBeenCalledWith("/login?redirectedFrom=/dashboard");
  });

  it("throws when session retrieval fails for non-auth reasons", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: false,
      error: { kind: "misconfigured", message: "session unavailable" }
    });

    await expect(DashboardPage()).rejects.toThrow("session unavailable");
  });

  it("throws when post loading fails", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      data: { id: "user-1" }
    });
    getAllPostsMock.mockResolvedValue({
      ok: false,
      error: { message: "failed to load posts" }
    });

    await expect(DashboardPage()).rejects.toThrow("failed to load posts");
  });

  it("renders dashboard shell and post list when data is available", async () => {
    requireAuthenticatedUserSessionMock.mockResolvedValue({
      ok: true,
      data: { id: "user-1" }
    });
    getAllPostsMock.mockResolvedValue({
      ok: true,
      data: [{ id: "post-1" }, { id: "post-2" }]
    });

    const html = renderToStaticMarkup(await DashboardPage());

    expect(getAllPostsMock).toHaveBeenCalledTimes(1);
    expect(filterBarRenderMock).toHaveBeenCalledTimes(1);
    expect(html).toContain("Overview");
    expect(html).toContain("Posts");
    expect(html).toContain("New post");
    expect(html).toContain("FilteredDashboardListStub:2");
  });
});
