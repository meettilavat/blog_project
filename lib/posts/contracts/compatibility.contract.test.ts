import { describe, expect, expectTypeOf, it } from "vitest";
import { parsePostRecord } from "./post-contract";
import {
  POSTS_CONTRACT_SCOPE,
  POSTS_CONTRACT_VERSION,
  type PostListItem,
  type PostRecord,
  type PostRecordCurrent
} from "./types";
import type { PostRecordRowCurrent } from "./persistence/types";

describe("lib/posts/contracts compatibility contract", () => {
  it("keeps canonical current post-record type aligned with post record", () => {
    expectTypeOf<PostRecordCurrent>().toEqualTypeOf<PostRecord>();
    expectTypeOf<PostListItem>().toMatchTypeOf<
      Pick<PostRecord, "id" | "title" | "slug" | "excerpt" | "coverImageUrl" | "status" | "createdAt" | "updatedAt">
    >();
  });

  it("maps persistence rows to canonical domain contract shape", () => {
    const row: PostRecordRowCurrent = {
      id: "post-1",
      title: "Contract",
      slug: "contract",
      excerpt: "Contract payload",
      content: { type: "doc", content: [] },
      cover_image_url: null,
      status: "draft",
      author_id: "author-1",
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-02T00:00:00.000Z"
    };

    const parsed = parsePostRecord(row);

    expect(parsed).toEqual({
      id: "post-1",
      title: "Contract",
      slug: "contract",
      excerpt: "Contract payload",
      content: { type: "doc", content: [] },
      coverImageUrl: null,
      status: "draft",
      authorId: "author-1",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-02T00:00:00.000Z"
    });
    expectTypeOf(parsed).toEqualTypeOf<PostRecordCurrent>();
  });

  it("exposes explicit contract scope/version governance artifacts", () => {
    expect(POSTS_CONTRACT_SCOPE).toBe("lib/posts/contracts/domain");
    expect(POSTS_CONTRACT_VERSION).toBe(1);
  });
});
