export const dynamic = "force-dynamic";

import { EditorForm } from "@/apps/admin/features/editor/ui/editor-form";
import { getDraftsForUser } from "@/lib/data/drafts";
import { requireAuthenticatedUserSession } from "@/lib/services/current-user-service";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  const session = await requireAuthenticatedUserSession();
  if (!session.ok) {
    if (session.error.kind === "unauthenticated") {
      redirect("/login?redirectedFrom=/editor/new");
    }
    throw new Error(session.error.message);
  }
  const draftsResult = await getDraftsForUser(session.user.id);
  if (!draftsResult.ok) {
    throw new Error(draftsResult.error.message);
  }
  return <EditorForm drafts={draftsResult.data} />;
}
