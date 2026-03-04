import { describe, expect, it } from "vitest";
import { getEditorOperationPolicy, type EditorOperation } from "./editor-operation-policy";

describe("lib/authz/editor-operation-policy.ts", () => {
  it("returns typed authz/error templates for each editor operation", () => {
    const operations: EditorOperation[] = ["save_post", "delete_post", "upload_image"];

    for (const operation of operations) {
      const policy = getEditorOperationPolicy(operation);
      expect(policy.unauthenticatedMessage.length > 0).toBe(true);
      expect(policy.forbiddenMessage.length > 0).toBe(true);
      expect(policy.supabaseMisconfiguredMessage).toBe("Supabase is not configured.");
      expect(policy.cookiesUnavailableMessage.length > 0).toBe(true);
      expect(policy.infrastructureMessage.length > 0).toBe(true);
    }
  });
});
