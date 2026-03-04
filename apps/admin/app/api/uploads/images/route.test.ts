import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { buildAbsoluteUrl } from "@/lib/url/build-absolute-url";
import {
  createSupabaseRouteClientDouble,
  createSupabaseStorageUploadFailureDouble,
  createSupabaseStorageUploadSuccessDouble,
  type SupabaseRouteUser
} from "@/tests/support/supabase-testkit";
import { POST } from "./route";

vi.mock("@/lib/supabase/clients/next-request-client", () => ({
  createSupabaseServerClientOrThrow: vi.fn()
}));

const HTTP_PROTOCOL = "http:";
const HTTPS_PROTOCOL = "https:";
const LOCALHOST_ORIGIN = `${HTTP_PROTOCOL}//localhost`;
const CDN_ORIGIN = `${HTTPS_PROTOCOL}//cdn.example.com`;
const BYTES_PER_MEBIBYTE = 2 ** 20;
const MAX_IMAGE_BYTES = 10 * BYTES_PER_MEBIBYTE;
type SupabaseRouteClient = ReturnType<typeof createSupabaseRouteClientDouble>;

function buildCdnUrl(path: string) {
  return buildAbsoluteUrl(path, CDN_ORIGIN);
}

const IMAGES_ENDPOINT_URL = buildAbsoluteUrl("/api/uploads/images", LOCALHOST_ORIGIN);

function makeRequest({
  target = "inline",
  file = new File(["image"], "photo.png", { type: "image/png" })
}: {
  target?: string;
  file?: File;
} = {}) {
  const body = new FormData();
  body.append("target", target);
  body.append("file", file);
  return new Request(IMAGES_ENDPOINT_URL, {
    method: "POST",
    body
  });
}

describe("apps/admin/app/api/uploads/images/route.ts", () => {
  const createClientMock = vi.mocked(createSupabaseServerClientOrThrow);

  function mockSupabaseClient(client: SupabaseRouteClient) {
    createClientMock.mockImplementation(async () => client as never);
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 500 when Supabase bootstrap fails", async () => {
    createClientMock.mockRejectedValue(new Error("Supabase missing"));

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Supabase is not configured." });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabaseClient(createSupabaseRouteClientDouble({ user: null }));

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "You must be signed in to upload images." });
  });

  it("returns 403 when user does not have upload permissions", async () => {
    const deniedUser: SupabaseRouteUser = {
      id: "user-1",
      app_metadata: { role: "viewer" }
    };
    mockSupabaseClient(
      createSupabaseRouteClientDouble({
        user: deniedUser
      })
    );

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "You do not have permission to upload images." });
  });

  it("returns 400 for invalid target values", async () => {
    mockSupabaseClient(createSupabaseRouteClientDouble());

    const response = await POST(makeRequest({ target: "avatars" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid upload target." });
  });

  it("returns 415 when file type is svg", async () => {
    mockSupabaseClient(createSupabaseRouteClientDouble());

    const response = await POST(
      makeRequest({
        file: new File(["<svg></svg>"], "diagram.svg", { type: "image/svg+xml" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(415);
    expect(payload).toEqual({ error: "SVG uploads are not allowed." });
  });

  it("returns 413 when image size exceeds 10MB", async () => {
    mockSupabaseClient(createSupabaseRouteClientDouble());

    const response = await POST(
      makeRequest({
        file: new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png", {
          type: "image/png"
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload).toEqual({ error: "Image is too large. Maximum size is 10MB." });
  });

  it("returns 400 when storage upload fails", async () => {
    const storage = createSupabaseStorageUploadFailureDouble({
      uploadErrorMessage: "bucket not found"
    });
    mockSupabaseClient(
      createSupabaseRouteClientDouble({
        storage: storage.storage
      })
    );

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "bucket not found" });
    storage.assertBucketSelected("blog-images");
    storage.assertPublicUrlNotRequested();
  });

  it("uploads image and returns public URL on success", async () => {
    const uploadedPath = "covers/1700000000000-cover.png";
    const publicUrl = buildCdnUrl(uploadedPath);
    const storage = createSupabaseStorageUploadSuccessDouble({
      uploadedPath,
      publicUrl
    });
    const supabase = createSupabaseRouteClientDouble({
      storage: storage.storage
    });
    mockSupabaseClient(supabase);

    const response = await POST(
      makeRequest({
        target: "covers",
        file: new File(["cover"], "cover image.png", { type: "image/png" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ url: publicUrl });
    storage.assertBucketSelected("blog-images");
    storage.assertUploadCalledWith({
      path: /^covers\/\d+-cover-image\.png$/,
      options: {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/png"
      }
    });
    storage.assertPublicUrlRequestedForUploadPath();
  });
});
