import { parseHttpUrl, type ParseHttpUrlOptions } from "@/lib/config/url-policy";

type NormalizedHttpUrlResult = {
  value: string | null;
  error: string | null;
};

export function buildHttpsUrl(hostname: string, pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, `https://${hostname}`).toString().replace(/\/$/, "");
}

export const normalizeHttpUrl = (
  value: string | undefined,
  options: ParseHttpUrlOptions = {}
): NormalizedHttpUrlResult => {
  const parsed = parseHttpUrl(value, options);
  const normalizedValue = parsed.url ? parsed.url.toString().replace(/\/$/, "") : null;

  return {
    value: normalizedValue,
    error: parsed.error
  };
};
