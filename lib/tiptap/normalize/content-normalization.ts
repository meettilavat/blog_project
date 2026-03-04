import { slugify } from "@/lib/content/slug";
import type {
  TiptapDocument,
  TiptapMark,
  TiptapNode,
  UnknownTiptapContent
} from "../model/tiptap-model";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isObjectRecord(value) ? value : null;
}

function parseTiptapMark(value: unknown): TiptapMark | null {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string") {
    return null;
  }

  return {
    type: record.type,
    attrs: asRecord(record.attrs) ?? undefined
  };
}

function parseTiptapNode(value: unknown, seen: WeakSet<object> = new WeakSet()): TiptapNode | null {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string") {
    return null;
  }
  if (seen.has(record)) {
    return null;
  }
  seen.add(record);

  const node: TiptapNode = {
    type: record.type
  };

  if (typeof record.text === "string") {
    node.text = record.text;
  }

  const attrs = asRecord(record.attrs);
  if (attrs) {
    node.attrs = attrs;
  }

  if (Array.isArray(record.marks)) {
    node.marks = record.marks
      .map((mark) => parseTiptapMark(mark))
      .filter((mark): mark is TiptapMark => Boolean(mark));
  }

  if (Array.isArray(record.content)) {
    node.content = record.content
      .map((entry) => parseTiptapNode(entry, seen))
      .filter((entry): entry is TiptapNode => Boolean(entry));
  }

  seen.delete(record);
  return node;
}

export function asParsedNodeArray(value: TiptapNode[] | undefined): TiptapNode[] {
  return Array.isArray(value) ? value : [];
}

export function textFromParsedNode(node: TiptapNode | null): string {
  const chunks: string[] = [];

  const walk = (current: TiptapNode | null) => {
    if (!current) return;
    if (current.type === "text" && typeof current.text === "string") {
      chunks.push(current.text);
    }
    asParsedNodeArray(current.content).forEach((child) => walk(child));
  };

  walk(node);
  return chunks.join("").replace(/\s+/g, " ").trim();
}

export function headingIdFromParsedNode(node: TiptapNode): string {
  const explicitId = typeof node.attrs?.id === "string" ? node.attrs.id.trim() : "";
  if (explicitId) {
    return explicitId;
  }
  return slugify(textFromParsedNode(node));
}

export function textFromTiptapNode(node: unknown): string {
  return textFromParsedNode(parseTiptapNode(node));
}

export function headingIdFromNode(node: unknown): string {
  const tiptapNode = parseTiptapNode(node);
  if (!tiptapNode) {
    return "";
  }
  return headingIdFromParsedNode(tiptapNode);
}

export function normalizeTiptapContent(content: UnknownTiptapContent): TiptapDocument {
  if (!content) return null;
  try {
    return parseTiptapNode(JSON.parse(JSON.stringify(content)));
  } catch {
    return null;
  }
}
