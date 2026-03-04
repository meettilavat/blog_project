import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const getPublishedPostsMock = vi.fn();
const postCardRenderMock = vi.fn((props: { href: string; post: { slug: string } }) => (
  <article>{`PostCardStub:${props.post.slug}:${props.href}`}</article>
));

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock()
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

import HomePage from "../page";

describe("apps/public/app/page.tsx", () => {
  beforeEach(() => {
    getPublishedPostsMock.mockReset();
    postCardRenderMock.mockClear();
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
