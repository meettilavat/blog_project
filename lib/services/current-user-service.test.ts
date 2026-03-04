import { describe, expect, it, vi } from "vitest";

const { getCurrentUserResultMock } = vi.hoisted(() => ({
  getCurrentUserResultMock: vi.fn()
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUserResult: getCurrentUserResultMock
}));

import {
  getOptionalCurrentUserSession,
  requireAuthenticatedUserSession
} from "./current-user-service";

describe("lib/services/current-user-service.ts", () => {
  it("passes through infrastructure auth results", async () => {
    getCurrentUserResultMock.mockResolvedValue({
      ok: false,
      error: {
        kind: "query",
        message: "auth failed"
      }
    });

    expect(await getOptionalCurrentUserSession()).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "auth failed"
      }
    });
  });

  it("maps null user session to explicit unauthenticated error", async () => {
    getCurrentUserResultMock.mockResolvedValue({
      ok: true,
      user: null
    });

    expect(
      await requireAuthenticatedUserSession({
        unauthenticatedMessage: "Sign in first."
      })
    ).toEqual({
      ok: false,
      error: {
        kind: "unauthenticated",
        message: "Sign in first."
      }
    });
  });

  it("uses the default unauthenticated message when none is provided", async () => {
    getCurrentUserResultMock.mockResolvedValue({
      ok: true,
      user: null
    });

    expect(await requireAuthenticatedUserSession()).toEqual({
      ok: false,
      error: {
        kind: "unauthenticated",
        message: "You must be signed in."
      }
    });
  });

  it("returns authenticated users unchanged", async () => {
    getCurrentUserResultMock.mockResolvedValue({
      ok: true,
      user: { id: "user-1" }
    });

    expect(await requireAuthenticatedUserSession()).toEqual({
      ok: true,
      user: { id: "user-1" }
    });
  });
});
