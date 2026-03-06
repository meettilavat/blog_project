import { describe, expect, it, vi } from "vitest";
import {
  AUTHOR_NAME,
  AUTHOR_PROFILE_PATH,
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  PUBLIC_SITE_NAME,
  RESUME_PAGE_DESCRIPTION,
  buildPublicAssetUrl,
  buildBlogPostingStructuredData,
  buildDefaultSocialImageUrl,
  buildProfilePageStructuredData,
  buildPublicPageUrl,
  buildWebSiteStructuredData
} from "./public-site";

const SITE_URL = "https://www.meettilavat.com";
const GITHUB_PROFILE_URL = "https://github.com/meettilavat";
const LINKEDIN_PROFILE_URL = "https://www.linkedin.com/in/meettilavat";

vi.mock("@/lib/public-links", () => ({
  getPublicLinks: () => ({
    githubProfile: GITHUB_PROFILE_URL,
    linkedInProfile: LINKEDIN_PROFILE_URL,
    sourceRepository: "https://github.com/meettilavat/blog_project"
  })
}));

describe("lib/seo/public-site.ts", () => {
  it("builds absolute public page urls against the configured site url", () => {
    expect(buildPublicPageUrl("/", SITE_URL)).toBe(SITE_URL);
    expect(buildPublicPageUrl(AUTHOR_PROFILE_PATH, SITE_URL)).toBe(`${SITE_URL}/resume`);
    expect(buildDefaultSocialImageUrl(SITE_URL)).toBe(`${SITE_URL}${DEFAULT_SOCIAL_IMAGE_PATH}`);
    expect(buildPublicAssetUrl("/cover.png", SITE_URL)).toBe(`${SITE_URL}/cover.png`);
    expect(buildPublicAssetUrl("https://images.example.com/cover.png", SITE_URL)).toBe(
      "https://images.example.com/cover.png"
    );
  });

  it("builds website structured data for the public homepage", () => {
    expect(buildWebSiteStructuredData(SITE_URL)).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: PUBLIC_SITE_NAME,
      alternateName: "meettilavat.com",
      url: SITE_URL,
      description: HOME_PAGE_DESCRIPTION,
      inLanguage: "en",
      image: `${SITE_URL}${DEFAULT_SOCIAL_IMAGE_PATH}`,
      sameAs: [GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL],
      publisher: {
        "@type": "Person",
        "@id": `${SITE_URL}/resume#person`,
        name: AUTHOR_NAME,
        url: `${SITE_URL}/resume`
      }
    });
  });

  it("builds profile page structured data graph for the resume page", () => {
    expect(buildProfilePageStructuredData(SITE_URL)).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/resume`,
          url: `${SITE_URL}/resume`,
          name: `${AUTHOR_NAME} Resume`,
          description: RESUME_PAGE_DESCRIPTION,
          isPartOf: {
            "@id": `${SITE_URL}#website`
          },
          mainEntity: {
            "@id": `${SITE_URL}/resume#person`
          }
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/resume#person`,
          name: AUTHOR_NAME,
          url: `${SITE_URL}/resume`,
          jobTitle: "Software Engineer",
          description: RESUME_PAGE_DESCRIPTION,
          image: `${SITE_URL}${DEFAULT_SOCIAL_IMAGE_PATH}`,
          sameAs: [GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL],
          homeLocation: {
            "@type": "Place",
            name: "Gujarat, India"
          },
          address: {
            "@type": "PostalAddress",
            addressRegion: "Gujarat",
            addressCountry: "IN"
          }
        }
      ]
    });
  });

  it("builds blog posting structured data for a published post", () => {
    expect(
      buildBlogPostingStructuredData({
        siteUrl: SITE_URL,
        slug: "my-post",
        title: "My Post",
        description: "Post description",
        createdAt: "2025-12-12T00:00:00.000Z",
        updatedAt: "2025-12-13T00:00:00.000Z",
        coverImageUrl: "https://images.example.com/cover.png"
      })
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "My Post",
      description: "Post description",
      url: `${SITE_URL}/posts/my-post`,
      mainEntityOfPage: `${SITE_URL}/posts/my-post`,
      datePublished: "2025-12-12T00:00:00.000Z",
      dateModified: "2025-12-13T00:00:00.000Z",
      author: {
        "@type": "Person",
        "@id": `${SITE_URL}/resume#person`,
        name: AUTHOR_NAME,
        url: `${SITE_URL}/resume`
      },
      publisher: {
        "@type": "Person",
        "@id": `${SITE_URL}/resume#person`,
        name: AUTHOR_NAME,
        url: `${SITE_URL}/resume`
      },
      isPartOf: {
        "@id": `${SITE_URL}#website`
      },
      inLanguage: "en",
      image: ["https://images.example.com/cover.png"]
    });
  });
});
