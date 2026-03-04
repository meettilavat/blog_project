const HTTP_PREFIX_PATTERN = /^https?:\/\//i;
const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export type ParseHttpUrlOptions = {
  allowHostOnly?: boolean;
};

type ParsedHttpUrlResult = {
  url: URL | null;
  error: string | null;
};

export const parseHttpUrl = (
  value: string | null | undefined,
  options: ParseHttpUrlOptions = {}
): ParsedHttpUrlResult => {
  if (!value || value.trim().length === 0) {
    return {
      url: null,
      error: null
    };
  }

  const candidate = value.trim();
  const withProtocol =
    options.allowHostOnly && !HTTP_PREFIX_PATTERN.test(candidate) ? `https://${candidate}` : candidate;

  try {
    const parsed = new URL(withProtocol);
    if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
      return {
        url: null,
        error: `unsupported protocol '${parsed.protocol}'`
      };
    }

    return {
      url: parsed,
      error: null
    };
  } catch {
    return {
      url: null,
      error: "invalid URL"
    };
  }
};
