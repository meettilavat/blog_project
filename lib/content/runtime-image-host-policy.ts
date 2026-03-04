import {
  getRuntimeUrlPolicy,
  isManagedSupabaseHost,
  type RuntimeUrlPolicy
} from "@/lib/config/runtime-url-policy";
import type { ImageHostPolicy } from "./image-host-policy";

export function createImageHostPolicyFromRuntimeUrlPolicy(
  runtimeUrlPolicy: Pick<RuntimeUrlPolicy, "allowedImageHosts">
): ImageHostPolicy {
  return {
    allowedImageHosts: runtimeUrlPolicy.allowedImageHosts,
    isManagedHost: isManagedSupabaseHost
  };
}

export function getRuntimeImageHostPolicy(): ImageHostPolicy {
  return createImageHostPolicyFromRuntimeUrlPolicy(getRuntimeUrlPolicy());
}
