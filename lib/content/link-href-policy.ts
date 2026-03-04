const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function isAllowedLinkHref(value: string): boolean {
  if (!value) {
    return false;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return SAFE_LINK_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}
