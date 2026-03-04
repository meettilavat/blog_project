import type { TiptapDocument, TiptapNode } from "../model/tiptap-model";
import {
  asParsedNodeArray,
  headingIdFromParsedNode,
  textFromParsedNode
} from "../normalize/content-normalization";
import { parsePositiveInteger } from "../normalize/parse-number";

export type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

type TiptapContentMetadata = {
  headings: HeadingItem[];
  plainText: string;
  reading: {
    minutes: number;
    words: number;
  };
};

export function deriveTiptapContentMetadata(content: TiptapDocument): TiptapContentMetadata {
  const headings: HeadingItem[] = [];
  const textChunks: string[] = [];

  const walk = (node: TiptapNode | null) => {
    if (!node) return;

    if (node.type === "text" && typeof node.text === "string") {
      textChunks.push(node.text);
    }

    const headingLevel = parsePositiveInteger(node.attrs?.level);
    if (node.type === "heading" && headingLevel) {
      const text = textFromParsedNode(node);
      const id = headingIdFromParsedNode(node);
      if (text && id) {
        headings.push({
          id,
          text,
          level: headingLevel
        });
      }
    }

    asParsedNodeArray(node.content).forEach((child) => walk(child));
  };

  walk(content);

  const plainText = textChunks.join(" ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).length : 0;

  return {
    headings,
    plainText,
    reading: {
      minutes: Math.max(1, Math.ceil(words / 200)),
      words
    }
  };
}
