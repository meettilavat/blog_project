import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getOptionalCurrentUserSessionMock } = vi.hoisted(() => ({
  getOptionalCurrentUserSessionMock: vi.fn()
}));

vi.mock("@/lib/services/current-user-service", () => ({
  getOptionalCurrentUserSession: getOptionalCurrentUserSessionMock
}));

vi.mock("@/components/layout/theme-toggle", () => ({
  default: () => <span>ThemeToggle</span>
}));

vi.mock("@/lib/actions/auth", () => ({
  signOutAction: vi.fn()
}));

import Header from "./header";

describe("apps/admin/components/shell/header.tsx", () => {
  it("hides admin navigation when user is not authenticated", async () => {
    getOptionalCurrentUserSessionMock.mockResolvedValue({
      ok: true,
      user: null
    });

    const html = renderToStaticMarkup(await Header());

    expect(html).toContain("/login");
    expect(html).not.toContain("/dashboard");
    expect(html).not.toContain("/editor/new");
  });

  it("shows admin navigation when user is authenticated", async () => {
    getOptionalCurrentUserSessionMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });

    const html = renderToStaticMarkup(await Header());

    expect(html).toContain("/dashboard");
    expect(html).toContain("/editor/new");
    expect(html).toContain("Sign out");
  });
});
