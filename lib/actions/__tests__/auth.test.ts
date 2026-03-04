import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientOrThrowMock, redirectMock } = vi.hoisted(() => ({
  createSupabaseServerClientOrThrowMock: vi.fn(),
  redirectMock: vi.fn()
}));

vi.mock("@/lib/supabase/clients/next-request-client", () => ({
  createSupabaseServerClientOrThrow: createSupabaseServerClientOrThrowMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

import { signInAction, signOutAction } from "../auth";

describe("lib/actions/auth.ts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("normalizes credentials and returns auth provider errors", async () => {
    const signInWithPassword = vi.fn(async () => ({
      error: {
        message: "invalid credentials"
      }
    }));
    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      auth: {
        signInWithPassword
      }
    });

    const formData = new FormData();
    formData.set("email", "  USER@Example.com ");
    formData.set("password", " pass123 ");

    const result = await signInAction({}, formData);

    expect(result).toEqual({ error: "invalid credentials" });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "pass123"
    });
  });

  it("returns configuration error when Supabase client bootstrap fails", async () => {
    createSupabaseServerClientOrThrowMock.mockRejectedValue(new Error("missing env"));

    const result = await signInAction({}, new FormData());

    expect(result).toEqual({ error: "missing env" });
  });

  it("signs out authenticated sessions and redirects home", async () => {
    const signOut = vi.fn(async () => ({}));
    createSupabaseServerClientOrThrowMock.mockResolvedValue({
      auth: {
        signOut
      }
    });

    await signOutAction();

    expect(signOut).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
