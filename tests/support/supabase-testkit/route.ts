import { createSupabaseAuthClientDouble, type SupabaseRouteUser } from "./auth";
import { createSupabaseStorageUploadSuccessDouble } from "./storage";
import type { SupabaseError } from "./env";

export function createSupabaseRouteClientDouble({
  user = { id: "user-1", app_metadata: { role: "admin" } },
  authErrorMessage,
  storage
}: {
  user?: SupabaseRouteUser | null;
  authErrorMessage?: string;
  storage?: {
    from: (bucket: string) => {
      upload: (path: string, file: File, options: Record<string, unknown>) => Promise<{
        data: {
          path: string;
        } | null;
        error: SupabaseError | null;
      }>;
      getPublicUrl: (path: string) => {
        data: {
          publicUrl: string;
        };
      };
    };
  };
} = {}) {
  const authClient = createSupabaseAuthClientDouble<SupabaseRouteUser>({
    user,
    errorMessage: authErrorMessage
  });

  return {
    auth: authClient.auth,
    storage: storage ?? createSupabaseStorageUploadSuccessDouble().storage
  };
}
