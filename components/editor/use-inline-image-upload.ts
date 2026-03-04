"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createSupabaseEditorImageUploader,
  toEditorImageUploadError
} from "@/lib/services/editor-image-upload";

type UploadedInlineImage = {
  url: string;
  width: number | null;
  height: number | null;
};

type InlineImageUploadResult =
  | {
      ok: true;
      image: UploadedInlineImage;
    }
  | {
      ok: false;
      message: string;
    };

export function useInlineImageUpload() {
  const uploaderState = useMemo(() => createSupabaseEditorImageUploader(), []);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("Image");
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadsEnabled = uploaderState.ok;

  const uploadInlineImage = useCallback(
    async (file: File): Promise<InlineImageUploadResult> => {
      if (!uploaderState.ok) {
        const details = uploaderState.error.cause
          ? `${uploaderState.error.message} (${uploaderState.error.cause})`
          : uploaderState.error.message;
        return {
          ok: false,
          message: details
        };
      }

      setUploading(true);
      setUploadLabel("Uploading...");
      setUploadProgress(10);
      const timer = setInterval(() => {
        setUploadProgress((previous) => (previous < 90 ? previous + 5 : previous));
      }, 300);

      try {
        const uploadedImage = await uploaderState.uploadEditorImage(file, "inline");
        return {
          ok: true,
          image: {
            url: uploadedImage.url,
            width: uploadedImage.width,
            height: uploadedImage.height
          }
        };
      } catch (error) {
        const typedError = toEditorImageUploadError(error, {
          kind: "upload",
          message: "Upload failed. Check your Supabase storage policy."
        });
        return {
          ok: false,
          message: typedError.cause ? `${typedError.message} (${typedError.cause})` : typedError.message
        };
      } finally {
        clearInterval(timer);
        setUploading(false);
        setUploadLabel("Image");
        setUploadProgress(0);
      }
    },
    [uploaderState]
  );

  return {
    uploadInlineImage,
    uploadLabel,
    uploadProgress,
    uploading,
    uploadsEnabled
  };
}
