import { parseHttpUrl } from "@/lib/config/url-policy";

const IMAGE_MIME_PREFIX = "image/";
const SVG_IMAGE_MIME_TYPE = "image/svg+xml";
const DATA_IMAGE_PREFIX = "data:image/";
const SVG_DATA_IMAGE_PREFIX = "data:image/svg";
const LOCAL_IMAGE_PATH_PATTERN = /^\/(?!\/)/;

export type ImageHostPolicy = {
  allowedImageHosts: ReadonlySet<string>;
  isManagedHost?: (hostname: string) => boolean;
};

function isLocalImagePath(value: string) {
  return LOCAL_IMAGE_PATH_PATTERN.test(value);
}
function isAllowedResolvedImageHost(hostname: string, policy: ImageHostPolicy) {
  if (policy.isManagedHost?.(hostname)) return true;
  return policy.allowedImageHosts.has(hostname);
}

export function isAllowedImageHost(
  urlString: string | null | undefined,
  policy: ImageHostPolicy
) {
  const parsed = parseHttpUrl(urlString);
  if (!parsed.url) {
    return false;
  }
  return isAllowedResolvedImageHost(parsed.url.hostname, policy);
}

export function isImageMimeType(value: string | null | undefined) {
  if (typeof value !== "string") {
    return false;
  }
  return value.toLowerCase().startsWith(IMAGE_MIME_PREFIX);
}

export function isSvgImageMimeType(value: string | null | undefined) {
  return typeof value === "string" && value.toLowerCase() === SVG_IMAGE_MIME_TYPE;
}

export function isAllowedImageSource(
  value: string | null | undefined,
  policy: ImageHostPolicy
) {
  if (!value) return false;
  if (isLocalImagePath(value)) return true;

  const normalized = value.toLowerCase();
  if (normalized.startsWith(DATA_IMAGE_PREFIX)) {
    return !normalized.startsWith(SVG_DATA_IMAGE_PREFIX);
  }

  const parsed = parseHttpUrl(value);
  if (!parsed.url) {
    return false;
  }
  return isAllowedResolvedImageHost(parsed.url.hostname, policy);
}
