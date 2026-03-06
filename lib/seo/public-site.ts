import { getPublicLinks } from "@/lib/public-links";
import { buildAbsoluteUrl } from "@/lib/url/build-absolute-url";

type JsonLdRecord = Record<string, unknown>;

type BlogPostingStructuredDataInput = {
  siteUrl: string;
  slug: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string | null;
  coverImageUrl?: string | null;
};

export const PUBLIC_SITE_NAME = "Meet Tilavat";
export const PUBLIC_SITE_DOMAIN_LABEL = "meettilavat.com";
export const PUBLIC_SITE_HOST = "www.meettilavat.com";
export const PUBLIC_SITE_FALLBACK_URL = `https://${PUBLIC_SITE_HOST}`;
export const PUBLIC_SITE_LOCALE = "en_US";
export const PUBLIC_SITE_TITLE_TEMPLATE = "%s — Meet Tilavat";
export const HOME_PAGE_TITLE = "Software Engineer Portfolio, Resume, and Blog";
export const HOME_PAGE_DESCRIPTION =
  "Meet Tilavat is a software engineer sharing portfolio work, resume details, and writing on web engineering, infrastructure, and dependable software systems.";
export const RESUME_PAGE_TITLE = "Resume and Experience";
export const RESUME_PAGE_DESCRIPTION =
  "Resume of Meet Tilavat, a software engineer based in Gujarat, India, focused on dependable web products, full-stack delivery, and automation.";
export const POST_DESCRIPTION_FALLBACK = "Read the latest post from Meet Tilavat.";
export const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image";
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "Meet Tilavat — software engineer portfolio, resume, and writing.";
export const AUTHOR_NAME = "Meet Tilavat";
export const AUTHOR_JOB_TITLE = "Software Engineer";
export const AUTHOR_PROFILE_PATH = "/resume";
export const AUTHOR_LOCATION_NAME = "Gujarat, India";

function buildSocialProfiles() {
  const publicLinks = getPublicLinks();
  return [publicLinks.githubProfile, publicLinks.linkedInProfile];
}

function buildWebsiteId(siteUrl: string) {
  return `${siteUrl}#website`;
}

function buildPersonId(siteUrl: string) {
  return `${buildAbsoluteUrl(AUTHOR_PROFILE_PATH, siteUrl)}#person`;
}

export function buildPublicPageUrl(path: string, siteUrl: string) {
  return buildAbsoluteUrl(path, siteUrl);
}

export function buildPublicAssetUrl(pathOrUrl: string, siteUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, `${siteUrl}/`).toString();
}

export function buildDefaultSocialImageUrl(siteUrl: string) {
  return buildPublicPageUrl(DEFAULT_SOCIAL_IMAGE_PATH, siteUrl);
}

export function buildWebSiteStructuredData(siteUrl: string): JsonLdRecord {
  const resumeUrl = buildPublicPageUrl(AUTHOR_PROFILE_PATH, siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": buildWebsiteId(siteUrl),
    name: PUBLIC_SITE_NAME,
    alternateName: PUBLIC_SITE_DOMAIN_LABEL,
    url: siteUrl,
    description: HOME_PAGE_DESCRIPTION,
    inLanguage: "en",
    image: buildDefaultSocialImageUrl(siteUrl),
    sameAs: buildSocialProfiles(),
    publisher: {
      "@type": "Person",
      "@id": buildPersonId(siteUrl),
      name: AUTHOR_NAME,
      url: resumeUrl
    }
  };
}

export function buildProfilePageStructuredData(siteUrl: string): JsonLdRecord {
  const resumeUrl = buildPublicPageUrl(AUTHOR_PROFILE_PATH, siteUrl);
  const personId = buildPersonId(siteUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": resumeUrl,
        url: resumeUrl,
        name: `${AUTHOR_NAME} Resume`,
        description: RESUME_PAGE_DESCRIPTION,
        isPartOf: {
          "@id": buildWebsiteId(siteUrl)
        },
        mainEntity: {
          "@id": personId
        }
      },
      {
        "@type": "Person",
        "@id": personId,
        name: AUTHOR_NAME,
        url: resumeUrl,
        jobTitle: AUTHOR_JOB_TITLE,
        description: RESUME_PAGE_DESCRIPTION,
        image: buildDefaultSocialImageUrl(siteUrl),
        sameAs: buildSocialProfiles(),
        homeLocation: {
          "@type": "Place",
          name: AUTHOR_LOCATION_NAME
        },
        address: {
          "@type": "PostalAddress",
          addressRegion: "Gujarat",
          addressCountry: "IN"
        }
      }
    ]
  };
}

export function buildBlogPostingStructuredData(
  input: BlogPostingStructuredDataInput
): JsonLdRecord {
  const articleUrl = buildPublicPageUrl(`/posts/${input.slug}`, input.siteUrl);
  const authorUrl = buildPublicPageUrl(AUTHOR_PROFILE_PATH, input.siteUrl);

  const structuredData: JsonLdRecord = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: articleUrl,
    mainEntityOfPage: articleUrl,
    datePublished: input.createdAt,
    dateModified: input.updatedAt ?? input.createdAt,
    author: {
      "@type": "Person",
      "@id": buildPersonId(input.siteUrl),
      name: AUTHOR_NAME,
      url: authorUrl
    },
    publisher: {
      "@type": "Person",
      "@id": buildPersonId(input.siteUrl),
      name: AUTHOR_NAME,
      url: authorUrl
    },
    isPartOf: {
      "@id": buildWebsiteId(input.siteUrl)
    },
    inLanguage: "en"
  };

  if (input.coverImageUrl) {
    structuredData.image = [buildPublicAssetUrl(input.coverImageUrl, input.siteUrl)];
  }

  return structuredData;
}
