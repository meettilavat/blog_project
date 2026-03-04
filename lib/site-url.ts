import { getRuntimeUrlPolicy } from "@/lib/config/runtime-url-policy";

export function getConfiguredSiteUrl(): string | null {
  return getRuntimeUrlPolicy().siteUrl;
}
