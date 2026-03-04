"use client";

import { useCallback, useRef } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";

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

type UploadInlineImage = (file: File) => Promise<InlineImageUploadResult>;

type UploadedFigureAttrs = {
  src: string;
  alt: string;
  caption: string;
  width: number | null;
  height: number | null;
};

function buildFigureNode(attrs: UploadedFigureAttrs): JSONContent {
  return {
    type: "image",
    attrs: {
      src: attrs.src,
      alt: attrs.alt,
      caption: attrs.caption,
      width: attrs.width ?? undefined,
      height: attrs.height ?? undefined
    }
  };
}

export function useEditorImageInsertion({
  editor,
  uploadInlineImage
}: {
  editor: Editor | null;
  uploadInlineImage: UploadInlineImage;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const result = await uploadInlineImage(file);
      if (!result.ok) {
        alert(result.message);
        return;
      }

      const caption = window.prompt("Caption for this image?", "") || "";
      editor
        ?.chain()
        .focus()
        .insertContent(
          buildFigureNode({
            src: result.image.url,
            alt: file.name,
            caption,
            width: result.image.width,
            height: result.image.height
          })
        )
        .run();
    },
    [editor, uploadInlineImage]
  );

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        void handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleFileChange = useCallback(
    (file: File) => {
      void handleFileUpload(file);
    },
    [handleFileUpload]
  );

  return {
    fileInputRef,
    triggerImageUpload,
    handleDrop,
    handleFileChange
  };
}
