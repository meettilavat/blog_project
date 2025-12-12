"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type PostRecord } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { deletePostAction } from "@/lib/actions/posts";
import { formatDate, isAllowedImageHost } from "@/lib/utils";
import { updateStatusAction } from "@/lib/actions/status";
import { Input } from "@/components/ui/input";

type Props = {
  posts: PostRecord[];
};

const filters = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" }
] as const;

export function FilteredDashboardList({ posts }: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);
    if (!query.trim()) return filtered;
    const lower = query.toLowerCase();
    return filtered.filter((p) => p.title.toLowerCase().includes(lower));
  }, [filter, posts, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(item.value)}
            className="uppercase tracking-[0.2em]"
          >
            {item.label}
          </Button>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title"
          className="w-56 rounded-full bg-card border-border/70"
        />
      </div>

      <div className="grid gap-4">
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-foreground/60">
            No posts in this filter.
          </div>
        )}
        {list.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-4">
                <div className="relative h-20 w-28 overflow-hidden rounded-xl bg-muted">
                  {post.cover_image_url ? (
                    isAllowedImageHost(post.cover_image_url) ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                      No cover
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === "published" ? "default" : "muted"}>
                      {post.status}
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                      {formatDate(post.updated_at)}
                    </span>
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">{post.title}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                    slug: {post.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/editor/${post.slug}`}>
                  <Button variant="outline" size="sm" className="uppercase tracking-[0.2em]">
                    Edit
                  </Button>
                </Link>
                <form action={updateStatusAction.bind(null, post.id, post.status === "published" ? "draft" : "published")}>
                  <Button
                    type="submit"
                    variant="subtle"
                    size="sm"
                    className="uppercase tracking-[0.2em]"
                  >
                    {post.status === "published" ? "Mark draft" : "Publish"}
                  </Button>
                </form>
                <form action={deletePostAction.bind(null, post.id, post.slug)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="uppercase tracking-[0.2em] text-red-600"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default FilteredDashboardList;
