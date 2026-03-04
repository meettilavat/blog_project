"use client";

import Image from "next/image";
import { useRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCoverImageUpload } from "@/components/editor/use-cover-image-upload";
import { cn } from "@/lib/ui/classnames";
import { isAllowedImageHost } from "@/lib/content/image-host-policy";
import { getRuntimeImageHostPolicy } from "@/lib/content/runtime-image-host-policy";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

type CoverPreviewMediaProps = {
  src: string;
  alt: string;
};

function CoverPreviewMedia({ src, alt }: CoverPreviewMediaProps) {
  const className = "h-full w-full object-cover";
  const imageHostPolicy = getRuntimeImageHostPolicy();

  if (!isAllowedImageHost(src, imageHostPolicy)) {
    // Fallback for arbitrary hosts to avoid Next Image host errors
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes="100vw"
      priority
    />
  );
}

function CoverImageField({ value, onChange }: Props) {
  const { canUpload, isUploading, error, uploadCoverImage, clearError } = useCoverImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingDisabled = !canUpload || isUploading;

  const handleUpload = async (file: File) => {
    const uploadResult = await uploadCoverImage(file);
    if (uploadResult.ok) {
      onChange(uploadResult.url);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="uppercase tracking-[0.2em]">Cover image</Label>
        <p className="text-xs text-foreground/60">High-res, thoughtful negative space.</p>
      </div>
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border/80 bg-muted",
          value ? "min-h-[260px]" : "min-h-[200px] grid place-items-center"
        )}
      >
        {value ? (
          <CoverPreviewMedia src={value} alt="Cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
            <ImageIcon className="h-5 w-5" />
            Add a cover image
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          placeholder="Paste a cover image URL"
          value={value}
          onChange={(event) => {
            clearError();
            onChange(event.target.value);
          }}
        />
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUpload(file);
                event.target.value = "";
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 uppercase tracking-[0.2em]"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingDisabled}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : canUpload ? "Upload" : "Paste URL"}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">
          {error.message}
          {error.cause ? ` (${error.cause})` : ""}
        </p>
      )}
    </div>
  );
}

export default CoverImageField;
