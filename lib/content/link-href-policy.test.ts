import { describe, expect, it } from "vitest";
import { isAllowedLinkHref } from "./link-href-policy";

const EXAMPLE_HOST = "example.com";
const EXAMPLE_DOCS_PATH = "/docs";
const EXAMPLE_HTTPS_DOCS_URL = new URL(EXAMPLE_DOCS_PATH, ["https", "://", EXAMPLE_HOST].join("")).toString();
const EXAMPLE_HTTP_DOCS_URL = new URL(EXAMPLE_DOCS_PATH, ["http", "://", EXAMPLE_HOST].join("")).toString();

describe("lib/content/link-href-policy.ts", () => {
  it("allows relative, http, https, and mailto hrefs", () => {
    expect(isAllowedLinkHref("/docs")).toBe(true);
    expect(isAllowedLinkHref(EXAMPLE_HTTPS_DOCS_URL)).toBe(true);
    expect(isAllowedLinkHref(EXAMPLE_HTTP_DOCS_URL)).toBe(true);
    expect(isAllowedLinkHref("mailto:team@example.com")).toBe(true);
  });

  it("rejects unsupported protocols and malformed hrefs", () => {
    expect(isAllowedLinkHref("javascript:alert(1)")).toBe(false);
    expect(isAllowedLinkHref("data:text/html;base64,abc")).toBe(false);
    expect(isAllowedLinkHref("")).toBe(false);
    expect(isAllowedLinkHref("not a url")).toBe(false);
  });
});
