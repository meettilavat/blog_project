import EditorForm from "@/components/editor/editor-form";
import { getDraftsForUser } from "@/lib/data/drafts";
import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectedFrom=/editor/new");
  }
  const drafts = await getDraftsForUser(user.id);
  return <EditorForm drafts={drafts} />;
}
