import Link from "next/link";
import { getAllPosts } from "@/lib/data/posts";
import { Button } from "@/components/ui/button";
import FilteredDashboardList from "@/components/dashboard/filter-bar";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectedFrom=/dashboard");
  }
  const posts = await getAllPosts();

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

      <FilteredDashboardList posts={posts} />
    </div>
  );
}

