import { describe, expect, expectTypeOf, it } from "vitest";
import {
  parsePostListItem,
  parsePostListItems,
  parsePostRecord
} from "@/lib/posts/contracts/post-contract";
import type { PostRecord, PostRecordCurrent } from "@/lib/posts/contracts/types";

const HTTPS_PROTOCOL = "https:";
const TEST_COVER_IMAGE_URL = new URL("/cover.jpg", `${HTTPS_PROTOCOL}//example.com`).toString();

describe("lib/posts/contracts/post-contract.ts", () => {
  it("parses current list-item schema shape", () => {
    const parsed = parsePostListItem({
      id: "post-1",
      title: "Current schema",
      slug: "current-schema",
      excerpt: "Summary",
      cover_image_url: TEST_COVER_IMAGE_URL,
      status: "published",
      created_at: "2026-02-10T00:00:00.000Z",
      updated_at: "2026-02-11T00:00:00.000Z"
    });

    expect(parsed).toMatchObject({
      id: "post-1",
      excerpt: "Summary",
      status: "published",
      coverImageUrl: TEST_COVER_IMAGE_URL
    });
  });

  it("accepts legacy list-item shape without excerpt", () => {
    const parsed = parsePostListItem({
      id: "post-legacy",
      title: "Legacy",
      slug: "legacy",
      cover_image_url: null,
      status: "draft",
      created_at: "2026-02-10T00:00:00.000Z",
      updated_at: "2026-02-11T00:00:00.000Z"
    });

    expect(parsed.excerpt).toBeNull();
    expect(parsed.status).toBe("draft");
  });

  it("parses detailed record payloads from current schema", () => {
    const parsed = parsePostRecord({
      id: "post-2",
      title: "Detailed",
      slug: "detailed",
      excerpt: "With content",
      content: { type: "doc", content: [] },
      cover_image_url: null,
      status: "published",
      author_id: "user-1",
      created_at: "2026-02-10T00:00:00.000Z",
      updated_at: "2026-02-11T00:00:00.000Z"
    });

    expect(parsed.authorId).toBe("user-1");
    expect(parsed.content).toEqual({ type: "doc", content: [] });
    expectTypeOf<PostRecordCurrent>().toEqualTypeOf<PostRecord>();
    expectTypeOf(parsed).toEqualTypeOf<PostRecordCurrent>();
  });

  it("rejects invalid contract payloads", () => {
    expect(() =>
      parsePostListItems([
        {
          id: "post-3",
          title: "Bad status",
          slug: "bad-status",
          cover_image_url: null,
          status: "archived",
          created_at: "2026-02-10T00:00:00.000Z",
          updated_at: "2026-02-11T00:00:00.000Z"
        }
      ])
    ).toThrow(/status/);
  });
});
