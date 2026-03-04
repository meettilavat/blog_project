export type EditorOperation = "save_post" | "delete_post" | "upload_image";

type EditorOperationPolicy = {
  unauthenticatedMessage: string;
  forbiddenMessage: string;
  supabaseMisconfiguredMessage: string;
  cookiesUnavailableMessage: string;
  infrastructureMessage: string;
};

const OPERATION_POLICIES: Record<EditorOperation, EditorOperationPolicy> = {
  save_post: {
    unauthenticatedMessage: "You must be signed in to save posts.",
    forbiddenMessage: "You do not have permission to save posts.",
    supabaseMisconfiguredMessage: "Supabase is not configured.",
    cookiesUnavailableMessage: "Request cookie context unavailable while saving posts.",
    infrastructureMessage: "Failed to initialize post save."
  },
  delete_post: {
    unauthenticatedMessage: "You must be signed in to delete posts.",
    forbiddenMessage: "You do not have permission to delete posts.",
    supabaseMisconfiguredMessage: "Supabase is not configured.",
    cookiesUnavailableMessage: "Request cookie context unavailable while deleting posts.",
    infrastructureMessage: "Failed to initialize post deletion."
  },
  upload_image: {
    unauthenticatedMessage: "You must be signed in to upload images.",
    forbiddenMessage: "You do not have permission to upload images.",
    supabaseMisconfiguredMessage: "Supabase is not configured.",
    cookiesUnavailableMessage: "Request cookie context unavailable while handling image upload.",
    infrastructureMessage: "Failed to initialize image upload."
  }
};

export function getEditorOperationPolicy(operation: EditorOperation): EditorOperationPolicy {
  return OPERATION_POLICIES[operation];
}
