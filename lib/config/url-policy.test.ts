import { describe, expect, it } from "vitest";
import { parseHttpUrl } from "./url-policy";

const HTTPS_PROTOCOL = "https:";
const FTP_PROTOCOL = "ftp:";
const EXAMPLE_HOST = "example.com";
const HOST_ONLY_INPUT = "meettilavat.com";
const BLOG_URL = new URL("/blog", `${HTTPS_PROTOCOL}//${EXAMPLE_HOST}`).toString().replace(/\/$/, "");
const FTP_FILE_URL = new URL("/file.txt", `${FTP_PROTOCOL}//${EXAMPLE_HOST}`).toString();
const HOST_ONLY_NORMALIZED_URL = new URL("/", `${HTTPS_PROTOCOL}//${HOST_ONLY_INPUT}`).toString();

describe("lib/config/url-policy.ts", () => {
  it("parses http/https urls and trims whitespace", () => {
    const parsed = parseHttpUrl(`  ${BLOG_URL}  `);

    expect(parsed.error).toBeNull();
    expect(parsed.url?.toString()).toBe(BLOG_URL);
  });

  it("rejects unsupported protocols", () => {
    const parsed = parseHttpUrl(FTP_FILE_URL);

    expect(parsed.url).toBeNull();
    expect(parsed.error).toBe("unsupported protocol 'ftp:'");
  });

  it("supports host-only inputs when configured", () => {
    const parsed = parseHttpUrl(HOST_ONLY_INPUT, {
      allowHostOnly: true
    });

    expect(parsed.error).toBeNull();
    expect(parsed.url?.toString()).toBe(HOST_ONLY_NORMALIZED_URL);
  });

  it("returns invalid URL for malformed candidates", () => {
    const parsed = parseHttpUrl("this is not a url");

    expect(parsed.url).toBeNull();
    expect(parsed.error).toBe("invalid URL");
  });
});
