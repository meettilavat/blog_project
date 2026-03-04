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

import HomePage from "./page";

describe("apps/admin/app/(public)/page.tsx", () => {
  beforeEach(() => {
    getPublishedPostsMock.mockReset();
    postCardRenderMock.mockClear();
  });

  it("renders an empty-state message when there are no posts", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: []
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("No posts exist yet. Authenticate, then craft your first entry.");
    expect(postCardRenderMock).not.toHaveBeenCalled();
  });

  it("renders post cards for returned posts", async () => {
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
  });
});
