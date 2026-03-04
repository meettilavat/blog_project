import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  DraftSummary,
  PostListItem,
  PostRecord,
  PostRecordCurrent,
} from "@/lib/posts/contracts/types";

const baseRecord: PostRecordCurrent = {
  id: "post-1",
  title: "Contract aliases",
  slug: "contract-aliases",
  excerpt: "Versioned aliases remain compatible.",
  content: null,
  coverImageUrl: null,
  status: "draft",
  authorId: "author-1",
  createdAt: "2026-03-04T00:00:00.000Z",
  updatedAt: "2026-03-04T00:00:00.000Z"
};

describe("lib/posts/contracts/types.ts", () => {
  it("keeps the canonical post-record contract stable", () => {
    const postRecordCurrent: PostRecordCurrent = baseRecord;
    expect(postRecordCurrent.slug).toBe(baseRecord.slug);
    expectTypeOf<PostRecordCurrent>().toEqualTypeOf<PostRecord>();
    expectTypeOf<PostListItem>().toMatchTypeOf<
      Pick<PostRecord, "id" | "title" | "slug" | "excerpt" | "coverImageUrl" | "status" | "createdAt" | "updatedAt">
    >();
    expectTypeOf<DraftSummary>().toMatchTypeOf<
      Pick<PostRecord, "id" | "title" | "slug" | "updatedAt">
    >();
  });
});
