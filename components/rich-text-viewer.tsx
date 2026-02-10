import type { JSONContent } from "@tiptap/core";
import Image from "next/image";
import { cn, isAllowedImageHost, sanitizeTiptapContent, slugify } from "@/lib/utils";

type Props = {
  content: JSONContent | null;
  className?: string;
};

const FALLBACK_IMAGE_WIDTH = 1200;
const FALLBACK_IMAGE_HEIGHT = 800;

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function textFromNode(node: any): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) return node.content.map(textFromNode).join("");
  return "";
}

function isRemoteHttpUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function isOptimizableImage(src: string) {
  if (src.startsWith("/")) return true;
  if (!isRemoteHttpUrl(src)) return false;
  return isAllowedImageHost(src);
}

function wrapMarks(text: React.ReactNode, marks: any[] | undefined, key: string): React.ReactNode {
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
        if (!href) return acc;
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

function isRenderableNode(value: any): value is { type: string } {
  return Boolean(value) && typeof value === "object" && typeof value.type === "string";
}

export function RichTextViewer({ content, className }: Props) {
  const safeContent = sanitizeTiptapContent(
    content ?? {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
    }
  );

  const renderNodes = (nodes: any[] | undefined, keyPrefix: string) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;
    return nodes
      .filter(isRenderableNode)
      .map((node, index) => renderNode(node, `${keyPrefix}-${index}`));
  };

  const renderNode = (node: any, key: string): React.ReactNode => {
    switch (node.type) {
      case "doc":
        return <>{renderNodes(node.content, key)}</>;
      case "paragraph":
        return <p key={key}>{renderNodes(node.content, key)}</p>;
      case "heading": {
        const level = parsePositiveInt(node.attrs?.level) ?? 2;
        const clamped = Math.min(6, Math.max(1, level));
        const text = textFromNode(node).trim();
        const id = typeof node.attrs?.id === "string" && node.attrs.id ? node.attrs.id : slugify(text);
        const children = renderNodes(node.content, key);
        switch (clamped) {
          case 1:
            return (
              <h1 key={key} id={id}>
                {children}
              </h1>
            );
          case 2:
            return (
              <h2 key={key} id={id}>
                {children}
              </h2>
            );
          case 3:
            return (
              <h3 key={key} id={id}>
                {children}
              </h3>
            );
          case 4:
            return (
              <h4 key={key} id={id}>
                {children}
              </h4>
            );
          case 5:
            return (
              <h5 key={key} id={id}>
                {children}
              </h5>
            );
          default:
            return (
              <h6 key={key} id={id}>
                {children}
              </h6>
            );
        }
      }
      case "text": {
        const value = typeof node.text === "string" ? node.text : "";
        return <span key={key}>{wrapMarks(value, node.marks, key)}</span>;
      }
      case "bulletList":
        return <ul key={key}>{renderNodes(node.content, key)}</ul>;
      case "orderedList": {
        const start = parsePositiveInt(node.attrs?.start);
        return (
          <ol key={key} start={start ?? undefined}>
            {renderNodes(node.content, key)}
          </ol>
        );
      }
      case "listItem":
        return <li key={key}>{renderNodes(node.content, key)}</li>;
      case "blockquote":
        return <blockquote key={key}>{renderNodes(node.content, key)}</blockquote>;
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      case "codeBlock": {
        const code = textFromNode(node);
        return (
          <pre key={key}>
            <code>{code}</code>
          </pre>
        );
      }
      case "table": {
        const rows: any[] = Array.isArray(node.content) ? node.content : [];
        const firstRow = rows[0];
        const firstCells: any[] = Array.isArray(firstRow?.content) ? firstRow.content : [];
        const isHeaderRow =
          firstCells.length > 0 && firstCells.every((cell) => cell?.type === "tableHeader");

        const renderRow = (row: any, rowKey: string) => (
          <tr key={rowKey}>
            {Array.isArray(row?.content)
              ? row.content.map((cell: any, cellIndex: number) => {
                  const cellKey = `${rowKey}-cell-${cellIndex}`;
                  const Tag = cell?.type === "tableHeader" ? "th" : "td";
                  return (
                    <Tag key={cellKey}>
                      {renderNodes(cell?.content, cellKey)}
                    </Tag>
                  );
                })
              : null}
          </tr>
        );

        return (
          <table key={key}>
            {isHeaderRow ? <thead>{renderRow(firstRow, `${key}-head`)}</thead> : null}
            <tbody>
              {rows.slice(isHeaderRow ? 1 : 0).map((row, index) => renderRow(row, `${key}-row-${index}`))}
            </tbody>
          </table>
        );
      }
      case "image": {
        const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
        if (!src) return null;
        const alt = typeof node.attrs?.alt === "string" && node.attrs.alt ? node.attrs.alt : "";
        const caption =
          typeof node.attrs?.caption === "string" ? node.attrs.caption.trim() : "";

        const width = parsePositiveInt(node.attrs?.width) ?? FALLBACK_IMAGE_WIDTH;
        const height = parsePositiveInt(node.attrs?.height) ?? FALLBACK_IMAGE_HEIGHT;
        const unoptimized = !isOptimizableImage(src);

        return (
          <figure key={key} className="tiptap-figure">
            <Image
              src={src}
              alt={alt || caption || "Embedded image"}
              width={width}
              height={height}
              sizes="(max-width: 768px) 92vw, 1060px"
              className="h-auto w-full"
              unoptimized={unoptimized}
            />
            {caption ? <figcaption>{caption}</figcaption> : null}
          </figure>
        );
      }
      default:
        return <div key={key}>{renderNodes(node.content, key)}</div>;
    }
  };

  if (!safeContent) return null;

  return (
    <div
      className={cn(
        "tiptap break-words text-[1.03rem] leading-[1.84] text-foreground/95",
        className ?? "mx-auto max-w-[80ch]"
      )}
    >
      {renderNode(safeContent, "doc")}
    </div>
  );
}

export default RichTextViewer;
