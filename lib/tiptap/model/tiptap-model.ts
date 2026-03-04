import type { RichContentValue } from "@/lib/content/rich-content-contract";

export type UnknownTiptapContent = unknown;
export type TiptapContentValue = RichContentValue;

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

export type TiptapDocument = TiptapNode | null;

declare const sanitizedTiptapNodeBrand: unique symbol;

export type SanitizedTiptapNode = Omit<TiptapNode, "content"> & {
  content?: SanitizedTiptapNode[];
  readonly [sanitizedTiptapNodeBrand]?: "sanitized";
};

export type SanitizedTiptapDocument = SanitizedTiptapNode | null;
