import type { User } from "@supabase/supabase-js";
import { vi } from "vitest";
import type { SupabaseError } from "./env";

export type SupabaseRouteUser = Pick<User, "id"> & {
  app_metadata?: {
    role?: string;
  };
  user_metadata?: {
    role?: string;
  };
};

export function createSupabaseAuthClientDouble<TUser extends Pick<User, "id"> = Pick<User, "id">>({
  user = null,
  errorMessage,
  throwMessage
}: {
  user?: TUser | null;
  errorMessage?: string;
  throwMessage?: string;
} = {}) {
  const getUser = vi.fn(async () => {
    if (throwMessage) {
      throw new Error(throwMessage);
    }
    return {
      data: {
        user: (user ?? null) as TUser | null
      },
      error: errorMessage ? ({ message: errorMessage } as SupabaseError) : null
    };
  });

  return {
    auth: {
      getUser
    },
    __mocks: {
      getUser
    }
  };
}
