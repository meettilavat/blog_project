import {
  type DraftSummary,
  type PostListItem,
  type PostRecord,
  type PostStatus
} from "@/lib/posts/contracts/domain/types";
import { parsePostContent } from "@/lib/posts/contracts/domain/content-adapter";
import { type PostRecordCurrent } from "@/lib/posts/contracts/compat/current";
import type { DraftSummaryRow, PostListItemRow, PostRecordRow } from "./persistence/types";

type UnknownRecord = Record<string, unknown>;

function asObject(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as UnknownRecord;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function asNullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  throw new Error(`${field} must be a string or null`);
}

function asPostStatus(value: unknown): PostStatus {
  if (value === "draft" || value === "published") {
    return value;
  }
  throw new Error("status must be draft or published");
}

function parsePostListItemRow(input: unknown): PostListItemRow {
  const row = asObject(input, "PostListItem");
  return {
    id: asString(row.id, "id"),
    title: asString(row.title, "title"),
    slug: asString(row.slug, "slug"),
    excerpt: asNullableString(row.excerpt, "excerpt"),
    cover_image_url: asNullableString(row.cover_image_url, "cover_image_url"),
    status: asPostStatus(row.status),
    created_at: asString(row.created_at, "created_at"),
    updated_at: asString(row.updated_at, "updated_at")
  };
}

function parsePostRecordRow(input: unknown): PostRecordRow {
  const row = asObject(input, "PostRecord");
  return {
    id: asString(row.id, "id"),
    title: asString(row.title, "title"),
    slug: asString(row.slug, "slug"),
    excerpt: asNullableString(row.excerpt, "excerpt"),
    content: parsePostContent(row.content),
    cover_image_url: asNullableString(row.cover_image_url, "cover_image_url"),
    status: asPostStatus(row.status),
    author_id: asNullableString(row.author_id, "author_id"),
    created_at: asString(row.created_at, "created_at"),
    updated_at: asString(row.updated_at, "updated_at")
  };
}

function parseDraftSummaryRow(input: unknown): DraftSummaryRow {
  const row = asObject(input, "DraftSummary");
  return {
    id: asString(row.id, "id"),
    title: asString(row.title, "title"),
    slug: asString(row.slug, "slug"),
    updated_at: asString(row.updated_at, "updated_at")
  };
}

function toDomainPostListItem(row: PostListItemRow): PostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toDomainPostRecord(row: PostRecordRow): PostRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toDomainDraftSummary(row: DraftSummaryRow): DraftSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    updatedAt: row.updated_at
  };
}

export function parsePostListItem(input: unknown): PostListItem {
  return toDomainPostListItem(parsePostListItemRow(input));
}

export function parsePostListItems(input: unknown): PostListItem[] {
  if (!Array.isArray(input)) {
    throw new Error("Post list payload must be an array");
  }
  return input.map((row) => parsePostListItem(row));
}

export function parsePostRecord(input: unknown): PostRecordCurrent {
  return toDomainPostRecord(parsePostRecordRow(input));
}

function parseDraftSummary(input: unknown): DraftSummary {
  return toDomainDraftSummary(parseDraftSummaryRow(input));
}

export function parseDraftSummaries(input: unknown): DraftSummary[] {
  if (!Array.isArray(input)) {
    throw new Error("Draft summary payload must be an array");
  }
  return input.map((row) => parseDraftSummary(row));
}
