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

    expect(html).toContain("Read article");
    expect(html).toContain("/posts/hello-post");
    expect(html).toContain("Cover pending");
  });

  it("renders admin card call-to-action", () => {
    const html = renderToStaticMarkup(
      <PostCard post={post} href="/editor/hello-post" variant="admin" />
    );

    expect(html).toContain("/editor/hello-post");
    expect(html).toContain(">Read<");
  });
});
