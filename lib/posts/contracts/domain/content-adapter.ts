import type { RichContentValue } from "@/lib/content/rich-content-contract";
import type { PostContent } from "./types";

export function toPostContent(value: RichContentValue): PostContent {
  return value;
}

export function toRichContentValue(content: PostContent): RichContentValue {
  return content;
}

export function parsePostContent(value: unknown): PostContent {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return toPostContent(value as RichContentValue);
  }
  throw new Error("content must be a JSON object or null");
}
