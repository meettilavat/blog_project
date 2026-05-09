import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { savePostAction } from "@/apps/admin/features/editor/server/post-actions";
import type { PostContent } from "@/lib/posts/contracts/domain/types";

const DRAFTS_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "drafts");

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = (body as { slug?: unknown })?.slug;
  const publish = (body as { publish?: unknown })?.publish === true;
  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    return NextResponse.json({ error: "Provide a valid `slug`." }, { status: 400 });
  }

  const filePath = path.join(DRAFTS_DIR, `${slug}.post.json`);
  if (!filePath.startsWith(DRAFTS_DIR + path.sep)) {
    return NextResponse.json({ error: "Path escapes drafts directory." }, { status: 400 });
  }

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return NextResponse.json(
      { error: `Draft file not found: drafts/${slug}.post.json` },
      { status: 404 }
    );
  }

  let parsed: {
    title?: string;
    excerpt?: string;
    coverImageUrl?: string | null;
    content?: unknown;
  };
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON parse failed.";
    return NextResponse.json({ error: `Draft JSON parse failed: ${message}` }, { status: 400 });
  }

  if (typeof parsed.title !== "string" || !parsed.title.trim()) {
    return NextResponse.json({ error: "Draft is missing a title." }, { status: 400 });
  }
  if (!parsed.content || typeof parsed.content !== "object") {
    return NextResponse.json({ error: "Draft is missing ProseMirror content." }, { status: 400 });
  }

  const result = await savePostAction({
    title: parsed.title,
    excerpt: parsed.excerpt,
    coverImageUrl: parsed.coverImageUrl ?? null,
    status: publish ? "published" : "draft",
    content: parsed.content as PostContent
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message, kind: result.error.kind },
      { status: result.error.kind === "unauthenticated" ? 401 : 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    slug: result.data.slug,
    status: publish ? "published" : "draft",
    editUrl: `/editor/${result.data.slug}`,
    viewUrl: publish ? `/posts/${result.data.slug}` : null
  });
}
