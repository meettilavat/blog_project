"use client";

type EditorImageUploadTarget = "inline" | "covers";
export type EditorImageUploadErrorKind = "client_init" | "upload";

type UploadedEditorImage = {
  url: string;
  width: number | null;
  height: number | null;
};

export type EditorImageUploadError = {
  kind: EditorImageUploadErrorKind;
  message: string;
  cause?: string;
};

type EditorImageUploader = (
  file: File,
  target?: EditorImageUploadTarget
) => Promise<UploadedEditorImage>;

type EditorImageUploaderState =
  | {
      ok: true;
      uploadEditorImage: EditorImageUploader;
    }
  | {
      ok: false;
      error: EditorImageUploadError;
    };

function extractErrorCause(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return undefined;
}

async function measureImage(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

export function toEditorImageUploadError(
  error: unknown,
  fallback: Pick<EditorImageUploadError, "kind" | "message">
): EditorImageUploadError {
  if (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    "message" in error &&
    typeof (error as { kind: unknown }).kind === "string" &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const typedError = error as EditorImageUploadError;
    return {
      kind: typedError.kind,
      message: typedError.message,
      cause: typedError.cause
    };
  }

  return {
    ...fallback,
    cause: extractErrorCause(error)
  };
}

export function createSupabaseEditorImageUploader(): EditorImageUploaderState {
  if (typeof window === "undefined") {
    return {
      ok: false,
      error: {
        kind: "client_init",
        message: "Image uploader is available only in browser runtime."
      }
    };
  }

  return {
    ok: true,
    uploadEditorImage: async (file, target = "inline") => {
      const [imageSize, response] = await Promise.all([
        measureImage(file),
        (async () => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("target", target);
          return fetch("/api/uploads/images", {
            method: "POST",
            body: formData
          });
        })()
      ]);

      if (!response.ok) {
        let cause: string | undefined;
        try {
          const payload = (await response.json()) as { error?: unknown };
          if (typeof payload.error === "string") {
            cause = payload.error;
          }
        } catch {
          // Keep fallback cause from response status if JSON parsing fails.
        }

        throw {
          kind: "upload",
          message: "Upload failed. Check authentication and storage policy.",
          cause: cause ?? `HTTP ${response.status}`
        } satisfies EditorImageUploadError;
      }

      const payload = (await response.json()) as { url?: unknown };
      if (typeof payload.url !== "string" || payload.url.length === 0) {
        throw {
          kind: "upload",
          message: "Upload endpoint returned an invalid payload."
        } satisfies EditorImageUploadError;
      }

      return {
        url: payload.url,
        width: imageSize.width,
        height: imageSize.height
      };
    }
  };
}
