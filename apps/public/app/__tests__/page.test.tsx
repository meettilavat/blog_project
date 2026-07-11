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
const postCardRenderMock = vi.fn((props: { href: string; post: { slug: string }; priority?: boolean; presentation?: string }) => (
  <article>{`PostCardStub:${props.post.slug}:${props.href}:${String(props.priority)}:${props.presentation ?? "standard"}`}</article>
));

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock()
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => SITE_URL
}));

vi.mock("@/components/posts/post-card", () => ({
  PostCard: (props: { href: string; post: { slug: string }; priority?: boolean; presentation?: string }) => postCardRenderMock(props)
}));

vi.mock("@/components/motion/fade-in", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/components/motion/staggered-list", () => ({
  StaggeredList: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
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
    expect(html).not.toContain("\u00a0");
    expect(html).toContain("Meet Tilavat");
    expect(html).toContain('href="/resume"');
    expect(html).toContain("No posts yet.");
    expect(html).toContain("Fresh writing is on the way.");
    expect(html).toContain("application/ld+json");
    expect(html).toContain("\"@type\":\"WebSite\"");
    expect(html).toContain(`\"url\":\"${SITE_URL}\"`);
    expect(postCardRenderMock).not.toHaveBeenCalled();
  });

  it("renders post cards when published posts are returned", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: [
        { id: "post-1", slug: "field-note" },
        { id: "post-2", slug: "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp" }
      ]
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(postCardRenderMock).toHaveBeenCalledTimes(2);
    expect(html).toContain("Selected work");
    expect(html).toContain("Field notes");
    expect(html).toContain("PostCardStub:building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp:/posts/building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp:true:featured");
    expect(html).toContain("PostCardStub:field-note:/posts/field-note:false:note");
    expect(postCardRenderMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      post: expect.objectContaining({ slug: "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp" }),
      presentation: "featured",
      priority: true
    }));
    expect(html).not.toContain("folio:grid-cols-2");
    expect(html).not.toContain("No posts yet. Fresh writing is on the way.");
  });

  it("uses two field-note columns only when at least two notes exist", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: [
        { id: "post-1", slug: "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp" },
        { id: "post-2", slug: "note-a" },
        { id: "post-3", slug: "note-b" }
      ]
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("folio:grid-cols-2");
  });

  it("renders a distinct availability error when posts cannot be loaded", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: false,
      error: { message: "database unavailable" }
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Writing is temporarily unavailable");
    expect(html).toContain("Please try again shortly");
    expect(html).not.toContain("No posts yet. Fresh writing is on the way.");
  });
});
