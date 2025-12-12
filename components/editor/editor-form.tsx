"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CoverImageField from "@/components/editor/cover-image-field";
import RichEditor from "@/components/editor/rich-editor";
import { savePostAction } from "@/lib/actions/posts";
import { type PostRecord, type PostStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type Props = {
  initialPost?: PostRecord | null;
  drafts?: PostRecord[];
};

const blankDoc: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
};

export function EditorForm({ initialPost, drafts = [] }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [cover, setCover] = useState(initialPost?.cover_image_url ?? "");
  const [content, setContent] = useState<JSONContent | null>(
    (initialPost?.content as JSONContent) ?? blankDoc
  );
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? "draft");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const createdInfo = useMemo(() => {
    if (!initialPost) return null;
    return `${initialPost.status === "published" ? "Published" : "Drafted"} ${formatDate(initialPost.created_at)}`;
  }, [initialPost]);

  const handleSave = (nextStatus: PostStatus) => {
    if (!title.trim()) {
      setMessage("Title is required.");
      return;
    }
    const normalizedContent = JSON.parse(JSON.stringify(content ?? blankDoc));
    startTransition(async () => {
      const result = await savePostAction({
        id: initialPost?.id,
        title: title.trim(),
        excerpt: excerpt.trim(),
        status: nextStatus,
        coverImageUrl: cover,
        content: normalizedContent
      });

      if (result?.error) {
        setMessage(result.error);
        return;
      }

      setStatus(nextStatus);
      const targetSlug = result?.slug ?? initialPost?.slug;
      const destination =
        nextStatus === "published" ? `/posts/${targetSlug}` : `/editor/${targetSlug}`;
      setMessage(nextStatus === "published" ? "Published" : "Saved");
      if (targetSlug) {
        router.push(destination);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between lg:col-span-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
            {initialPost ? "Edit entry" : "New entry"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {initialPost ? "Refine your draft" : "Compose something crisp"}
          </h1>
          {createdInfo && (
            <span className="text-sm text-foreground/60">{createdInfo}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status === "published" ? "default" : "muted"}>
            {status}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave("draft")}
            isLoading={isPending}
            className="uppercase tracking-[0.2em]"
          >
            Save draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSave("published")}
            isLoading={isPending}
            className="uppercase tracking-[0.2em]"
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-5 rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
          <Label htmlFor="title" className="uppercase tracking-[0.2em]">
            Title
          </Label>
          <Input
            id="title"
            placeholder="A headline with clarity..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="text-xl font-medium tracking-tight"
          />
        </div>

        <div className="space-y-3 rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="space-y-1">
            <Label htmlFor="excerpt" className="uppercase tracking-[0.2em]">
              Description
            </Label>
            <p className="text-xs text-foreground/60">
              Appears on the homepage and in social previews.
            </p>
          </div>
          <Textarea
            id="excerpt"
            placeholder="A short summary for the listing page..."
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <CoverImageField value={cover} onChange={setCover} />

        <RichEditor initialContent={content} onChange={setContent} />

        {message && (
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground">
            {message}
          </div>
        )}
      </div>

      <aside className="hidden space-y-4 rounded-3xl border border-border/70 bg-card p-4 shadow-soft lg:block">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Recent drafts</p>
        {drafts.length === 0 && (
          <p className="text-sm text-foreground/60">No drafts yet.</p>
        )}
        <ul className="space-y-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/editor/${draft.slug}`}
                className="block rounded-xl border border-border/70 bg-muted px-3 py-2 text-sm font-medium text-foreground hover:border-foreground/50"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {formatDate(draft.updated_at)}
                </div>
                {draft.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default EditorForm;
