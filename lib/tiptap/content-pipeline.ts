import {
  normalizeTiptapContent,
} from "./normalize/content-normalization";
import { sanitizeParsedTiptapContent } from "./normalize/content-sanitizer";
import { deriveTiptapContentMetadata, type HeadingItem } from "./metadata/content-metadata";
import { getRuntimeImageHostPolicy } from "@/lib/content/runtime-image-host-policy";
import type {
  SanitizedTiptapDocument,
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

export function analyzeContent(content: UnknownTiptapContent): TiptapContentAnalysis {
  const normalized = normalizeTiptapContent(content);
  const sanitized = sanitizeParsedTiptapContent(normalized, getRuntimeImageHostPolicy());
  const metadata = deriveTiptapContentMetadata(sanitized);

  return {
    content: sanitized,
    headings: metadata.headings,
    plainText: metadata.plainText,
    reading: metadata.reading
  };
}
