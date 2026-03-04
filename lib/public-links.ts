import { buildHttpsUrl, normalizeHttpUrl } from "@/lib/config/http-url";

type PublicLinks = {
  githubProfile: string;
  linkedInProfile: string;
  sourceRepository: string;
};

function resolvePublicLink(envVarName: string, fallback: string) {
  const parsed = normalizeHttpUrl(process.env[envVarName]);
  if (parsed.value) {
    return parsed.value;
  }
  if (parsed.error) {
    process.emitWarning(`[public-links] Ignoring invalid ${envVarName}: ${parsed.error}`, {
      code: "PUBLIC_LINKS_CONFIG"
    });
  }
  return fallback;
}

const DEFAULT_PUBLIC_LINKS: PublicLinks = {
  githubProfile: buildHttpsUrl("github.com", "/meettilavat"),
  linkedInProfile: buildHttpsUrl("www.linkedin.com", "/in/meettilavat"),
  sourceRepository: buildHttpsUrl("github.com", "/meettilavat/blog_project")
};

export function getPublicLinks(): PublicLinks {
  return {
    githubProfile: resolvePublicLink("NEXT_PUBLIC_GITHUB_PROFILE_URL", DEFAULT_PUBLIC_LINKS.githubProfile),
    linkedInProfile: resolvePublicLink("NEXT_PUBLIC_LINKEDIN_PROFILE_URL", DEFAULT_PUBLIC_LINKS.linkedInProfile),
    sourceRepository: resolvePublicLink("NEXT_PUBLIC_SOURCE_REPOSITORY_URL", DEFAULT_PUBLIC_LINKS.sourceRepository)
  };
}
