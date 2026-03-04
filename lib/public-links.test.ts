import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import { getPublicLinks } from "./public-links";

const EXAMPLE_HOST = "example.com";

const DEFAULT_PUBLIC_LINKS = {
  githubProfile: buildHttpsUrl("github.com", "/meettilavat"),
  linkedInProfile: buildHttpsUrl("www.linkedin.com", "/in/meettilavat"),
  sourceRepository: buildHttpsUrl("github.com", "/meettilavat/blog_project")
};

const OVERRIDE_PUBLIC_LINKS = {
  githubProfile: buildHttpsUrl(EXAMPLE_HOST, "/github"),
  linkedInProfile: buildHttpsUrl(EXAMPLE_HOST, "/linkedin"),
  sourceRepository: buildHttpsUrl(EXAMPLE_HOST, "/source")
};

describe("lib/public-links.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default profile/repository links when env vars are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_PROFILE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_LINKEDIN_PROFILE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SOURCE_REPOSITORY_URL", "");

    expect(getPublicLinks()).toEqual({
      githubProfile: DEFAULT_PUBLIC_LINKS.githubProfile,
      linkedInProfile: DEFAULT_PUBLIC_LINKS.linkedInProfile,
      sourceRepository: DEFAULT_PUBLIC_LINKS.sourceRepository
    });
  });

  it("uses valid env overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_PROFILE_URL", `${OVERRIDE_PUBLIC_LINKS.githubProfile}/`);
    vi.stubEnv("NEXT_PUBLIC_LINKEDIN_PROFILE_URL", OVERRIDE_PUBLIC_LINKS.linkedInProfile);
    vi.stubEnv("NEXT_PUBLIC_SOURCE_REPOSITORY_URL", OVERRIDE_PUBLIC_LINKS.sourceRepository);

    expect(getPublicLinks()).toEqual({
      githubProfile: OVERRIDE_PUBLIC_LINKS.githubProfile,
      linkedInProfile: OVERRIDE_PUBLIC_LINKS.linkedInProfile,
      sourceRepository: OVERRIDE_PUBLIC_LINKS.sourceRepository
    });
  });

  it("ignores malformed env override values", () => {
    const warnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_GITHUB_PROFILE_URL", "not-a-url");
    vi.stubEnv("NEXT_PUBLIC_LINKEDIN_PROFILE_URL", "ftp://example.com/profile");
    vi.stubEnv("NEXT_PUBLIC_SOURCE_REPOSITORY_URL", "");

    const links = getPublicLinks();

    expect(links).toEqual({
      githubProfile: DEFAULT_PUBLIC_LINKS.githubProfile,
      linkedInProfile: DEFAULT_PUBLIC_LINKS.linkedInProfile,
      sourceRepository: DEFAULT_PUBLIC_LINKS.sourceRepository
    });
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      "[public-links] Ignoring invalid NEXT_PUBLIC_GITHUB_PROFILE_URL: invalid URL",
      { code: "PUBLIC_LINKS_CONFIG" }
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "[public-links] Ignoring invalid NEXT_PUBLIC_LINKEDIN_PROFILE_URL: unsupported protocol 'ftp:'",
      { code: "PUBLIC_LINKS_CONFIG" }
    );
  });
});
