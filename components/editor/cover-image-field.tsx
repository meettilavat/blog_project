"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, isAllowedImageHost } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function CoverImageField({ value, onChange }: Props) {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingDisabled = !supabase || uploading;

  const handleUpload = async (file: File) => {
    if (!supabase) {
      alert("Configure Supabase to upload images, or paste a URL instead.");
      return;
    }
    setUploading(true);
    const path = `covers/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Cover upload failed", error.message);
      alert("Upload failed. Check storage bucket + policy.");
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(data.path);
    onChange(publicUrl.publicUrl);
    setUploading(false);
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
          isAllowedImageHost(value) ? (
            <Image
              src={value}
              alt="Cover"
              fill
              className="h-full w-full object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            // Fallback for arbitrary hosts to avoid Next Image host errors
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt="Cover"
              className="h-full w-full object-cover"
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          )
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
          onChange={(event) => onChange(event.target.value)}
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
            {uploading ? "Uploading..." : supabase ? "Upload" : "Paste URL"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CoverImageField;
