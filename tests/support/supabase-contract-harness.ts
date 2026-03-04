import { vi } from "vitest";
import type {
  ServerClientFactory,
  ServerClientOptions
} from "@/lib/supabase/contracts/client-boundary";

type CookieSnapshot = Array<{ name: string; value: string }>;
type CookieMutation = Array<{ name: string; value: string; options: { path: string } }>;

function assertServerClientCookieContract(options: ServerClientOptions) {
  if (
    typeof options.cookies?.getAll !== "function" ||
    typeof options.cookies?.setAll !== "function"
  ) {
    throw new Error("Supabase server-client options must include cookie getAll/setAll methods.");
  }
}

export function createServerClientCaptureHarness(clientResult: unknown = {}) {
  let capturedOptions: ServerClientOptions | null = null;
  const createServerClientImpl = vi.fn(
    (_url: string, _anonKey: string, options: ServerClientOptions) => {
      assertServerClientCookieContract(options);
      capturedOptions = options;
      return clientResult;
    }
  ) as ServerClientFactory;

  return {
    createServerClientImpl,
    readCookies(): CookieSnapshot {
      return capturedOptions?.cookies.getAll() ?? [];
    },
    writeCookies(cookies: CookieMutation) {
      capturedOptions?.cookies.setAll(cookies);
    }
  };
}
