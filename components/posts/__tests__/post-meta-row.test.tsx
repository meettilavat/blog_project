import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostMetaRow } from "@/components/posts/post-meta-row";

describe("components/posts/post-meta-row.tsx", () => {
  it("renders created label, update badge, and reading stats", () => {
    const html = renderToStaticMarkup(
      <PostMetaRow
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-03-01T00:00:00.000Z"
        publishedPrefix="Published"
        readStats={{ minutes: 4, words: 812 }}
      />
    );

    expect(html).toContain("Published");
    expect(html).toContain("Last updated");
    expect(html).toContain("4 min read");
    expect(html).toContain("812 words");
  });
});
