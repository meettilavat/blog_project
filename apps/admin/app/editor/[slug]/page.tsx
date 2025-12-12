import { notFound } from "next/navigation";
import EditorForm from "@/components/editor/editor-form";
import { getPostBySlug } from "@/lib/data/posts";
import { getDraftsForUser } from "@/lib/data/drafts";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectedFrom=/editor/${slug}`);
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const drafts = user ? await getDraftsForUser(user.id) : [];

  return <EditorForm initialPost={post} drafts={drafts} />;
}

