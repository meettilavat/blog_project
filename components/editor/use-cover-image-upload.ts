"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createSupabaseEditorImageUploader,
  toEditorImageUploadError,
  type EditorImageUploadError
} from "@/lib/services/editor-image-upload";

type CoverImageUploadResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: EditorImageUploadError;
    };

export function useCoverImageUpload() {
  const uploaderState = useMemo(() => createSupabaseEditorImageUploader(), []);
  const [isUploading, setIsUploading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<EditorImageUploadError | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const canUpload = hasMounted && uploaderState.ok;
  const error = runtimeError ?? (hasMounted && !uploaderState.ok ? uploaderState.error : null);

  const uploadCoverImage = useCallback(
    async (file: File): Promise<CoverImageUploadResult> => {
      if (!uploaderState.ok) {
        setRuntimeError(uploaderState.error);
        return {
          ok: false,
          error: uploaderState.error
        };
      }

      setIsUploading(true);
      setRuntimeError(null);

      try {
        const uploadedImage = await uploaderState.uploadEditorImage(file, "covers");
        return {
          ok: true,
          url: uploadedImage.url
        };
      } catch (uploadError) {
        const typedError = toEditorImageUploadError(uploadError, {
          kind: "upload",
          message: "Upload failed. Check storage bucket + policy."
        });
        setRuntimeError(typedError);
        return {
          ok: false,
          error: typedError
        };
      } finally {
        setIsUploading(false);
      }
    },
    [uploaderState]
  );

  const clearError = useCallback(() => {
    setRuntimeError(null);
  }, []);

  return {
    canUpload,
    isUploading,
    error,
    uploadCoverImage,
    clearError
  };
}
