import { NextResponse } from "next/server";
import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { mapSupabaseBootstrapErrorToHttpResponse } from "@/lib/supabase/errors/error-mapping";
import { requireEditorUser } from "@/lib/authz/editor-policy";
import { getEditorOperationPolicy } from "@/lib/authz/editor-operation-policy";
import { isImageMimeType, isSvgImageMimeType } from "@/lib/content/image-host-policy";

type RequestSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClientOrThrow>>;

// Filesystem-routed Next.js API handler (invoked by /api/uploads/images without direct imports).
const BYTES_PER_KIBIBYTE = 2 ** 10;
const BYTES_PER_MEBIBYTE = BYTES_PER_KIBIBYTE ** 2;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * BYTES_PER_MEBIBYTE;

function normalizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function isValidTarget(value: FormDataEntryValue | null): value is "inline" | "covers" {
  return value === "inline" || value === "covers";
}

function isValidImageFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && isImageMimeType(value.type);
}

export async function POST(request: Request) {
  const policy = getEditorOperationPolicy("upload_image");
  let supabase: RequestSupabaseClient;
  try {
    supabase = await createSupabaseServerClientOrThrow();
  } catch (error) {
    const response = mapSupabaseBootstrapErrorToHttpResponse({
      error,
      misconfiguredMessage: policy.supabaseMisconfiguredMessage,
      cookiesUnavailableMessage: policy.cookiesUnavailableMessage,
      unexpectedMessage: policy.infrastructureMessage
    });
    return NextResponse.json(response.body, { status: response.status });
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  const authorization = requireEditorUser(authError ? null : user, {
    unauthenticatedMessage: policy.unauthenticatedMessage,
    forbiddenMessage: policy.forbiddenMessage
  });
  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.message }, { status: authorization.status });
  }

  const formData = await request.formData();
  const target = formData.get("target");
  const file = formData.get("file");

  if (!isValidTarget(target)) {
    return NextResponse.json({ error: "Invalid upload target." }, { status: 400 });
  }

  if (!isValidImageFile(file) || file.size <= 0) {
    return NextResponse.json({ error: "A valid image file is required." }, { status: 400 });
  }

  if (isSvgImageMimeType(file.type)) {
    return NextResponse.json({ error: "SVG uploads are not allowed." }, { status: 415 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.` },
      { status: 413 }
    );
  }

  const safeName = normalizeFileName(file.name || "image");
  const path = `${target}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage.from("blog-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: publicUrlData } = supabase.storage.from("blog-images").getPublicUrl(data.path);
  return NextResponse.json({ url: publicUrlData.publicUrl });
}
