import type { JSONContent } from "@tiptap/core";
import Image from "next/image";
import { isAllowedImageHost, sanitizeTiptapContent, slugify } from "@/lib/utils";

type ImageDimensions = { width: number; height: number };

type Props = {
  content: JSONContent | null;
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

async function getRemoteImageDimensions(url: string): Promise<ImageDimensions | null> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Range: "bytes=0-65535"
      }
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }

  const png = parsePng(bytes);
  if (png) return png;
  const gif = parseGif(bytes);
  if (gif) return gif;
  const webp = parseWebp(bytes);
  if (webp) return webp;
  const jpeg = parseJpeg(bytes);
  if (jpeg) return jpeg;

  return null;
}

function parsePng(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return null;
  }

  const width =
    (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height =
    (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseGif(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 10) return null;
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function parseWebp(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 30) return null;
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") return null;

  const chunk = String.fromCharCode(...bytes.slice(12, 16));

  // VP8X: width/height are stored as 24-bit values (minus 1).
  if (chunk === "VP8X") {
    if (bytes.length < 30) return null;
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }

  // VP8 : width/height are 16-bit values at fixed offsets.
  if (chunk === "VP8 ") {
    if (bytes.length < 30) return null;
    const width = bytes[26] | (bytes[27] << 8);
    const height = bytes[28] | (bytes[29] << 8);
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }

  // VP8L: width/height are packed starting at byte 21.
  if (chunk === "VP8L") {
    if (bytes.length < 25) return null;
    // https://developers.google.com/speed/webp/docs/riff_container#simple_file_format_lossless
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }

  return null;
}

function parseJpeg(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 4) return null;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    // Skip padding bytes.
    while (marker === 0xff && offset < bytes.length) {
      offset += 1;
    }

    // Markers without length.
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break; // Start of Scan

    if (offset + 1 >= bytes.length) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2) break;

    const isSof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSof && offset + 7 < bytes.length) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (width > 0 && height > 0) return { width, height };
      return null;
    }

    offset += length;
  }

  return null;
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
            className="underline underline-offset-4 decoration-border hover:decoration-foreground"
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

export async function RichTextViewer({ content }: Props) {
  const safeContent = sanitizeTiptapContent(
    content ?? {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
    }
  );

  const uniqueImageSrcs = new Set<string>();
  const walkForImages = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "image") {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      if (src && isAllowedImageHost(src)) {
        const width = parsePositiveInt(node.attrs?.width);
        const height = parsePositiveInt(node.attrs?.height);
        if (!width || !height) uniqueImageSrcs.add(src);
      }
    }
    if (Array.isArray(node.content)) node.content.forEach(walkForImages);
  };
  walkForImages(safeContent);

  const imageDimensionsBySrc = new Map<string, ImageDimensions>();
  await Promise.all(
    Array.from(uniqueImageSrcs).map(async (src) => {
      const dims = await getRemoteImageDimensions(src);
      if (dims) imageDimensionsBySrc.set(src, dims);
    })
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

        const width =
          parsePositiveInt(node.attrs?.width) ??
          imageDimensionsBySrc.get(src)?.width ??
          FALLBACK_IMAGE_WIDTH;
        const height =
          parsePositiveInt(node.attrs?.height) ??
          imageDimensionsBySrc.get(src)?.height ??
          FALLBACK_IMAGE_HEIGHT;
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

  return <div className="tiptap text-lg leading-8">{renderNode(safeContent, "doc")}</div>;
}

export default RichTextViewer;
