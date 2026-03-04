import type { RichTextMark } from "./rich-text-node-types";
import { isAllowedLinkHref } from "@/lib/content/link-href-policy";

export function wrapTextMarks(
  text: React.ReactNode,
  marks: RichTextMark[] | undefined,
  key: string
): React.ReactNode {
  if (!Array.isArray(marks) || marks.length === 0) return text;

  return marks.reduce<React.ReactNode>((acc, mark, index) => {
    if (!mark || typeof mark !== "object") return acc;
    const markKey = `${key}-mark-${index}`;
    switch (mark.type) {
      case "bold":
        return <strong key={markKey}>{acc}</strong>;
      case "italic":
        return <em key={markKey}>{acc}</em>;
      case "strike":
        return <s key={markKey}>{acc}</s>;
      case "code":
        return <code key={markKey}>{acc}</code>;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : undefined;
        if (!href || !isAllowedLinkHref(href)) return acc;
        return (
          <a
            key={markKey}
            href={href}
            className="underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
          >
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}
