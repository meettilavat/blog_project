import { expect, vi } from "vitest";
import { buildAbsoluteUrl } from "@/lib/url/build-absolute-url";
import {
  DEFAULT_ROUTE_UPLOAD_PATH,
  DEFAULT_ROUTE_UPLOAD_URL_ORIGIN
} from "./env";

type StorageUploadCall = {
  path: string;
  file: File;
  options: Record<string, unknown>;
};

type StorageUploadMode = "success" | "failure";

type StorageUploadDoubleOptions = {
  mode: StorageUploadMode;
  uploadedPath?: string;
  publicUrl?: string;
  uploadErrorMessage?: string;
};

function createStorageUploadState(uploadedPath: string) {
  return {
    uploadCall: null as StorageUploadCall | null,
    publicUrlRequestedPath: null as string | null,
    uploadedFilePath: uploadedPath
  };
}

function createStorageUploadDouble({
  mode,
  uploadedPath = DEFAULT_ROUTE_UPLOAD_PATH,
  publicUrl,
  uploadErrorMessage
}: StorageUploadDoubleOptions) {
  const state = createStorageUploadState(uploadedPath);

  const upload = vi.fn(async (path: string, file: File, options: Record<string, unknown>) => {
    state.uploadCall = {
      path,
      file,
      options
    };

    if (mode === "failure") {
      return {
        data: null,
        error: {
          message: uploadErrorMessage ?? "Upload failed."
        }
      };
    }

    state.uploadedFilePath = uploadedPath;
    return {
      data: {
        path: uploadedPath
      },
      error: null
    };
  });

  const getPublicUrl = vi.fn((path: string) => {
    state.publicUrlRequestedPath = path;
    return {
      data: {
        publicUrl: publicUrl ?? buildAbsoluteUrl(path, DEFAULT_ROUTE_UPLOAD_URL_ORIGIN)
      }
    };
  });

  const from = vi.fn((_bucket: string) => ({
    upload,
    getPublicUrl
  }));

  return {
    storage: {
      from
    },
    assertBucketSelected(bucket: string) {
      expect(from).toHaveBeenCalledWith(bucket);
    },
    assertUploadCalledWith({
      path,
      fileMatcher = expect.any(File),
      options
    }: {
      path: RegExp | string;
      fileMatcher?: unknown;
      options: Record<string, unknown>;
    }) {
      expect(state.uploadCall).not.toBeNull();
      if (path instanceof RegExp) {
        expect(state.uploadCall?.path).toMatch(path);
      } else {
        expect(state.uploadCall?.path).toBe(path);
      }
      expect(state.uploadCall?.file).toEqual(fileMatcher);
      expect(state.uploadCall?.options).toEqual(options);
    },
    assertPublicUrlRequestedForUploadPath() {
      expect(state.publicUrlRequestedPath).toBe(state.uploadedFilePath);
    },
    assertPublicUrlNotRequested() {
      expect(getPublicUrl).not.toHaveBeenCalled();
    }
  };
}

export function createSupabaseStorageUploadSuccessDouble({
  uploadedPath = DEFAULT_ROUTE_UPLOAD_PATH,
  publicUrl
}: {
  uploadedPath?: string;
  publicUrl?: string;
} = {}) {
  const storageClient = createStorageUploadDouble({
    mode: "success",
    uploadedPath,
    publicUrl
  });

  return {
    storage: storageClient.storage,
    assertBucketSelected: storageClient.assertBucketSelected,
    assertUploadCalledWith: storageClient.assertUploadCalledWith,
    assertPublicUrlRequestedForUploadPath: storageClient.assertPublicUrlRequestedForUploadPath
  };
}

export function createSupabaseStorageUploadFailureDouble({
  uploadErrorMessage
}: {
  uploadErrorMessage: string;
}) {
  const storageClient = createStorageUploadDouble({
    mode: "failure",
    uploadErrorMessage
  });

  return {
    storage: storageClient.storage,
    assertBucketSelected: storageClient.assertBucketSelected,
    assertPublicUrlNotRequested: storageClient.assertPublicUrlNotRequested
  };
}
