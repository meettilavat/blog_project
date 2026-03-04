export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllPosts } from "@/lib/posts/repository/admin-posts-repository";
import { Button } from "@/components/ui/button";
import FilteredDashboardList from "@/components/dashboard/filter-bar";
import { requireAuthenticatedUserSession } from "@/lib/services/current-user-service";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await requireAuthenticatedUserSession();
  if (!session.ok) {
    if (session.error.kind === "unauthenticated") {
      redirect("/login?redirectedFrom=/dashboard");
    }
    throw new Error(session.error.message);
  }
  const postsResult = await getAllPosts();
  if (!postsResult.ok) {
    throw new Error(postsResult.error.message);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">Overview</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Posts</h1>
        </div>
        <Link href="/editor/new">
          <Button className="uppercase tracking-[0.2em]">New post</Button>
        </Link>
      </div>

      <FilteredDashboardList posts={postsResult.data} />
    </div>
  );
}
