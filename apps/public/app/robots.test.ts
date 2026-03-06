import { afterEach, describe, expect, it, vi } from "vitest";

const { getConfiguredSiteUrlMock } = vi.hoisted(() => ({
  getConfiguredSiteUrlMock: vi.fn()
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: getConfiguredSiteUrlMock
}));

import robots from "./robots";

const HTTPS_PROTOCOL = "https";
const SITE_HOST = "www.meettilavat.com";
const SITE_URL = `${HTTPS_PROTOCOL}://${SITE_HOST}`;

describe("apps/public/app/robots.ts", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns allow-all crawl rules and sitemap when site url is configured", () => {
    getConfiguredSiteUrlMock.mockReturnValue(SITE_URL);

    expect(robots()).toEqual({
      rules: [
        {
          userAgent: "*",
          allow: "/"
        }
      ],
      sitemap: `${SITE_URL}/sitemap.xml`
    });
  });

  it("omits sitemap when site url is not configured", () => {
    getConfiguredSiteUrlMock.mockReturnValue(null);

    expect(robots()).toEqual({
      rules: [
        {
          userAgent: "*",
          allow: "/"
        }
      ],
      sitemap: undefined
    });
  });
});
