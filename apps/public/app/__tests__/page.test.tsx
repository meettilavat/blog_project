import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE
} from "@/lib/seo/public-site";

const { SITE_URL } = vi.hoisted(() => ({
  SITE_URL: "https://www.meettilavat.com"
}));

const getPublishedPostsMock = vi.fn();
const postCardRenderMock = vi.fn((props: { href: string; post: { slug: string } }) => (
  <article>{`PostCardStub:${props.post.slug}:${props.href}`}</article>
));

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock()
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => SITE_URL
}));

vi.mock("@/components/posts/post-card", () => ({
  PostCard: (props: { href: string; post: { slug: string } }) => postCardRenderMock(props)
}));

vi.mock("@/components/motion/fade-in", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/components/motion/staggered-list", () => ({
  StaggeredList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StaggeredItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

import HomePage, { metadata } from "../page";

describe("apps/public/app/page.tsx", () => {
  beforeEach(() => {
    getPublishedPostsMock.mockReset();
    postCardRenderMock.mockClear();
  });

  it("exports homepage metadata tuned for search and social sharing", () => {
    expect(metadata.title).toBe(HOME_PAGE_TITLE);
    expect(metadata.description).toBe(HOME_PAGE_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe(SITE_URL);
    expect(metadata.twitter?.images).toEqual([DEFAULT_SOCIAL_IMAGE_PATH]);
  });

  it("renders hero and empty-state content when no posts are available", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: []
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Notes on building software");
    expect(html).toContain("No posts yet. Fresh writing is on the way.");
    expect(html).toContain(">resume<");
    expect(html).toContain("application/ld+json");
    expect(html).toContain("\"@type\":\"WebSite\"");
    expect(html).toContain(`\"url\":\"${SITE_URL}\"`);
    expect(postCardRenderMock).not.toHaveBeenCalled();
  });

  it("renders post cards when published posts are returned", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: [
        { id: "post-1", slug: "first-post" },
        { id: "post-2", slug: "second-post" }
      ]
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(postCardRenderMock).toHaveBeenCalledTimes(2);
    expect(html).toContain("PostCardStub:first-post:/posts/first-post");
    expect(html).toContain("PostCardStub:second-post:/posts/second-post");
    expect(html).not.toContain("No posts yet. Fresh writing is on the way.");
  });
});
