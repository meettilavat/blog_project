import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  DraftSummaryRow,
  PostListItemRow,
  PostRecordRow,
  PostRecordRowCurrent,
} from "./types";

describe("lib/posts/contracts/persistence/types.ts", () => {
  it("defines snake_case persistence row contracts", () => {
    const row: PostRecordRowCurrent = {
      id: "post-1",
      title: "Post title",
      slug: "post-title",
      excerpt: null,
      content: { type: "doc", content: [] },
      cover_image_url: null,
      status: "draft",
      author_id: "author-1",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z"
    };

    const listItem: PostListItemRow = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      cover_image_url: row.cover_image_url,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    const draft: DraftSummaryRow = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      updated_at: row.updated_at
    };

    expect(Object.keys(row)).toContain("cover_image_url");
    expect(listItem.slug).toBe("post-title");
    expect(draft.updated_at).toBe("2024-01-02T00:00:00.000Z");
    expectTypeOf(row.cover_image_url).toEqualTypeOf<string | null>();
    expectTypeOf<PostRecordRowCurrent>().toEqualTypeOf<PostRecordRow>();
    expectTypeOf(listItem).toMatchTypeOf<PostListItemRow>();
    expectTypeOf(draft).toMatchTypeOf<DraftSummaryRow>();
  });
});
