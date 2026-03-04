import type { MetadataRoute } from "next";
import { getConfiguredSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const configuredSiteUrl = getConfiguredSiteUrl();
  const sitemap = configuredSiteUrl ? `${configuredSiteUrl}/sitemap.xml` : undefined;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/"
      }
    ],
    sitemap
  };
}
