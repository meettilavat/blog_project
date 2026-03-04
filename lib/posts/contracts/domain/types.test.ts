import { describe, expectTypeOf, it } from "vitest";
import type {
  DraftSummary,
  PostContent,
  PostListItem,
  PostRecord,
  PostStatus
} from "./types";

describe("lib/posts/contracts/domain/types.ts", () => {
  it("defines stable domain contracts independent from compatibility aliases", () => {
    expectTypeOf<PostStatus>().toEqualTypeOf<"draft" | "published">();
    expectTypeOf<PostContent>().toMatchTypeOf<Record<string, unknown> | null>();
    expectTypeOf<PostListItem>().toMatchTypeOf<
      Pick<PostRecord, "id" | "title" | "slug" | "excerpt" | "coverImageUrl" | "status" | "createdAt" | "updatedAt">
    >();
    expectTypeOf<DraftSummary>().toMatchTypeOf<
      Pick<PostRecord, "id" | "title" | "slug" | "updatedAt">
    >();
  });
});
