export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { EditorForm } from "@/apps/admin/features/editor/ui/editor-form";
import { getPostBySlug } from "@/lib/posts/repository/admin-posts-repository";
import { getDraftsForUser } from "@/lib/data/drafts";
import { requireAuthenticatedUserSession } from "@/lib/services/current-user-service";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireAuthenticatedUserSession();
  if (!session.ok) {
    if (session.error.kind === "unauthenticated") {
      redirect(`/login?redirectedFrom=/editor/${slug}`);
    }
    throw new Error(session.error.message);
  }
  const user = session.user;

  const [postResult, draftsResult] = await Promise.all([
    getPostBySlug(slug),
    getDraftsForUser(user.id)
  ]);

  if (!postResult.ok) {
    throw new Error(postResult.error.message);
  }

  if (!postResult.data) {
    notFound();
  }

  if (!draftsResult.ok) {
    throw new Error(draftsResult.error.message);
  }

  return <EditorForm initialPost={postResult.data} drafts={draftsResult.data} />;
}
