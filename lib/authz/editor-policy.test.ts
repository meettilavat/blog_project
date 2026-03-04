import { describe, expect, it, vi } from "vitest";
import {
  enforcePostOwnership,
  hasEditorRole,
  requireEditorUser
} from "./editor-policy";

describe("lib/authz/editor-policy.ts", () => {
  it("accepts admin/editor users and rejects missing roles", () => {
    expect(
      hasEditorRole({
        id: "user-1",
        app_metadata: { role: "admin" }
      })
    ).toBe(true);

    expect(
      hasEditorRole({
        id: "user-2",
        user_metadata: { role: "editor" }
      })
    ).toBe(true);

    expect(
      hasEditorRole({
        id: "user-3",
        app_metadata: { role: "viewer" }
      })
    ).toBe(false);
  });

  it("returns status-aware authorization results for editor policy checks", () => {
    expect(
      requireEditorUser(null, {
        unauthenticatedMessage: "Sign in first."
      })
    ).toEqual({
      ok: false,
      status: 401,
      message: "Sign in first."
    });

    expect(
      requireEditorUser(
        {
          id: "viewer-1",
          app_metadata: { role: "viewer" }
        },
        {
          forbiddenMessage: "Editors only."
        }
      )
    ).toEqual({
      ok: false,
      status: 403,
      message: "Editors only."
    });

    expect(
      requireEditorUser({
        id: "editor-1",
        app_metadata: { role: "editor" }
      })
    ).toEqual({
      ok: true,
      user: {
        id: "editor-1",
        app_metadata: { role: "editor" }
      }
    });
  });

  it("applies author ownership filter through a single helper", () => {
    const eq = vi.fn(() => ({ eq }));
    const query = { eq };

    const ownedQuery = enforcePostOwnership(query, "author-1");

    expect(ownedQuery).toEqual({ eq });
    expect(eq).toHaveBeenCalledWith("author_id", "author-1");
  });
});
