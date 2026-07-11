import {
  normalizeTiptapContent,
  headingIdFromParsedNode,
} from "./normalize/content-normalization";
import { sanitizeParsedTiptapContent } from "./normalize/content-sanitizer";
import { deriveTiptapContentMetadata, type HeadingItem } from "./metadata/content-metadata";
import { getRuntimeImageHostPolicy } from "@/lib/content/runtime-image-host-policy";
import type {
  SanitizedTiptapDocument,
  SanitizedTiptapNode,
  UnknownTiptapContent
} from "./model/tiptap-model";

type TiptapContentAnalysis = {
  content: SanitizedTiptapDocument;
  headings: HeadingItem[];
  plainText: string;
  reading: {
    minutes: number;
    words: number;
  };
};

function assignUniqueHeadingIds(content: SanitizedTiptapDocument): SanitizedTiptapDocument {
  if (!content) return null;
  const idCounts = new Map<string, number>();

  const visit = (node: SanitizedTiptapNode): SanitizedTiptapNode => {
    const contentNodes = node.content?.map(visit);
    const nextNode: SanitizedTiptapNode = {
      ...node,
      ...(contentNodes ? { content: contentNodes } : {})
    };

    if (node.type !== "heading") return nextNode;
    const baseId = headingIdFromParsedNode(nextNode);
    if (!baseId) return nextNode;
    const count = (idCounts.get(baseId) ?? 0) + 1;
    idCounts.set(baseId, count);

    return {
      ...nextNode,
      attrs: {
        ...nextNode.attrs,
        id: count === 1 ? baseId : `${baseId}-${count}`
      }
    };
  };

  return visit(content);
}

export function analyzeContent(content: UnknownTiptapContent): TiptapContentAnalysis {
  const normalized = normalizeTiptapContent(content);
  const sanitized = sanitizeParsedTiptapContent(normalized, getRuntimeImageHostPolicy());
  const renderContent = assignUniqueHeadingIds(sanitized);
  const metadata = deriveTiptapContentMetadata(renderContent);

  return {
    content: renderContent,
    headings: metadata.headings,
    plainText: metadata.plainText,
    reading: metadata.reading
  };
}
