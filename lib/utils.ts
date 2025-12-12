import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(date);
}

export function isSignificantlyUpdated(createdAt?: string | null, updatedAt?: string | null) {
  if (!createdAt || !updatedAt) return false;
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  const difference = updated - created;
  const oneDay = 1000 * 60 * 60 * 24;
  return difference > oneDay;
}

export function isAllowedImageHost(urlString: string | null | undefined) {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString);
    const allowed = [
      "images.unsplash.com",
      "images.pexels.com",
      "lh3.googleusercontent.com",
      "localhost",
      "127.0.0.1"
    ];
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      allowed.push(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
    }
    const host = parsed.hostname;
    if (host.endsWith(".supabase.co") || host.endsWith(".supabase.in")) return true;
    return allowed.includes(host);
  } catch {
    return false;
  }
}

export type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

export function extractHeadings(content: any): HeadingItem[] {
  const results: HeadingItem[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (node.type === "heading" && node.attrs?.level && node.content) {
      const text = (node.content || [])
        .filter((child: any) => child.type === "text")
        .map((child: any) => child.text)
        .join(" ")
        .trim();
      if (text) {
        results.push({
          id: slugify(text),
          text,
          level: node.attrs.level
        });
      }
    }
    if (Array.isArray(node.content)) {
      node.content.forEach((child: any) => walk(child));
    }
  };
  walk(content);
  return results;
}

export function plainTextFromContent(content: any): string {
  let buffer = "";
  const walk = (node: any) => {
    if (!node) return;
    if (node.type === "text" && node.text) {
      buffer += `${node.text} `;
    }
    if (Array.isArray(node.content)) {
      node.content.forEach((child: any) => walk(child));
    }
  };
  walk(content);
  return buffer.trim();
}

export function readingTimeFromContent(content: any) {
  const text = plainTextFromContent(content);
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { minutes, words };
}

function isSafeHref(value: string) {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isSafeImageSrc(value: string) {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("data:image/")) {
    return !value.startsWith("data:image/svg");
  }
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeTiptapContent(content: any) {
  if (!content) return content;
  let clone: any;
  try {
    clone = JSON.parse(JSON.stringify(content));
  } catch {
    return content;
  }

  const walk = (node: any): any => {
    if (!node || typeof node !== "object") return node;

    if ((node.type === "image" || node.type === "img") && node.attrs?.src) {
      const src = String(node.attrs.src);
      if (!isSafeImageSrc(src)) return null;
    }

    if (Array.isArray(node.marks)) {
      node.marks = node.marks.filter((mark: any) => {
        if (mark?.type !== "link") return true;
        const href = mark?.attrs?.href;
        return typeof href === "string" && isSafeHref(href);
      });
    }

    if (node.type === "link" && typeof node.attrs?.href === "string") {
      if (!isSafeHref(node.attrs.href)) {
        delete node.attrs.href;
      }
    }

    if (Array.isArray(node.content)) {
      node.content = node.content.map(walk).filter(Boolean);
    }

    return node;
  };

  return walk(clone);
}
