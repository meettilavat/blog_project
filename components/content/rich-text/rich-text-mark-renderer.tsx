import type { RichTextMark } from "./rich-text-node-types";
import { isAllowedLinkHref } from "@/lib/content/link-href-policy";

function getRawUrlLabel(text: React.ReactNode, href: string) {
  if (typeof text !== "string" || text.trim() !== href) return null;

  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const hostname = url.hostname.replace(/^www\./, "");
    const hostLabel = hostname === "github.com" ? "GitHub" : hostname;
    const pathLabel = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
    return pathLabel ? `${hostLabel} / ${pathLabel}` : hostLabel;
  } catch {
    return null;
  }
}

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
        const rawUrlLabel = getRawUrlLabel(text, href);
        return (
          <a
            key={markKey}
            href={href}
            title={rawUrlLabel ? href : undefined}
            className="underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
          >
            {rawUrlLabel ?? acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}
