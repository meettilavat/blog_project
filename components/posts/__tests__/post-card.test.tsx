import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostCard } from "@/components/posts/post-card";
import type { PostListItem } from "@/lib/posts/contracts/types";

const post: PostListItem = {
  id: "post-1",
  title: "Hello Post",
  slug: "hello-post",
  excerpt: "",
  coverImageUrl: null,
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
};

describe("components/posts/post-card.tsx", () => {
  it("renders public card call-to-action", () => {
    const html = renderToStaticMarkup(
      <PostCard post={post} href="/posts/hello-post" variant="public" />
    );

    expect(html).toContain("Read field note");
    expect(html).toContain("/posts/hello-post");
    expect(html).toContain("Cover pending");
    expect(html).toContain("text-foreground/70");
    expect(html).not.toContain("text-foreground/55");
    expect(html).not.toContain("text-foreground/45");
  });

  it("prioritizes the cover image when requested", () => {
    const html = renderToStaticMarkup(
      <PostCard
        post={{ ...post, coverImageUrl: "/cover.png" }}
        href="/posts/hello-post"
        variant="public"
        presentation="featured"
        priority
      />
    );

    expect(html).toContain('<link rel="preload" as="image" href="/cover.png"');
    expect(html).toContain('data-post-presentation="featured"');
    expect(html).toContain("aspect-[16/10]");
    expect(html).toContain("spread:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]");
    expect(html).toContain("spread:items-start");
    expect(html).toContain("spread:self-center");
    expect(html).not.toContain("project:items-stretch");
    expect(html).toContain("object-center");
    expect(html).not.toContain("object-top");
    expect(html).toContain("(max-width: 1279px) calc(100vw - 2.5rem)");
  });

  it("renders admin card call-to-action", () => {
    const html = renderToStaticMarkup(
      <PostCard post={post} href="/editor/hello-post" variant="admin" />
    );

    expect(html).toContain("/editor/hello-post");
    expect(html).toContain(">Read<");
  });
});
