import { http } from "@/lib/http";
import type {
  Video,
  VideoCreateUploadResult,
  VideoPreviewResponse,
  VideoUploadSession,
} from "@/features/videos/types/video";
import type { PaginatedResponse } from "@/types/pagination";
import {
  normalizeAdminActionResult,
  withResponseMessage,
  type AdminActionResult,
} from "@/lib/admin-response";

export type ListVideosParams = {
  centerId?: string | number;
  page?: number;
  per_page?: number;
  course_id?: string | number;
  search?: string;
  q?: string;
  status?: string | number;
  source_type?: string | number;
  source_provider?: string;
  created_from?: string;
  created_to?: string;
};

export type CreateVideoFromUrlPayload = {
  source_type: "url";
  source_url: string;
  title_translations: {
    en: string;
    ar?: string;
  };
  description_translations?: {
    en?: string;
    ar?: string;
  };
  tags?: string[];
  duration_seconds?: number | null;
  thumbnail_url?: string | null;
};

export type UpdateVideoPayload = {
  title_translations?: {
    en?: string;
    ar?: string;
  };
  description_translations?: {
    en?: string;
    ar?: string;
  };
  tags?: string[];
  duration_seconds?: number | null;
  thumbnail_url?: string | null;
};

export type CreateVideoUploadPayload = {
  title_translations: {
    en: string;
    ar?: string;
  };
  description_translations?: {
    en?: string;
    ar?: string;
  };
  tags?: string[];
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
};

export type CreateVideoUploadSessionPayload = {
  video_id: string | number;
  original_filename: string;
};

export type ListVideoUploadSessionsParams = {
  centerId?: string | number;
  status?: string;
  page?: number;
  per_page?: number;
};

type RawVideosResponse = {
  data?: Video[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

type RawVideoResponse = {
  data?: Video;
};

type RawVideoCreateUploadResponse = {
  data?: {
    video?: Video;
    upload_session?: VideoUploadSession;
  };
};

type RawUploadSessionResponse = {
  data?: VideoUploadSession;
};

type RawVideoUploadSessionsResponse = {
  data?: VideoUploadSession[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

type RawVideoPreviewResponse = {
  data?: VideoPreviewResponse;
};

function resolveEnvelopeMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as {
    message?: unknown;
    error?: { message?: unknown };
  };

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (
    record.error &&
    typeof record.error.message === "string" &&
    record.error.message.trim()
  ) {
    return record.error.message;
  }

  return fallback;
}

function assertEnvelopeSuccess(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") return;

  const record = payload as { success?: unknown };
  if (record.success === false) {
    throw new Error(resolveEnvelopeMessage(payload, fallbackMessage));
  }
}

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/videos`;
}

export async function listVideos(
  params: ListVideosParams,
): Promise<PaginatedResponse<Video>> {
  if (!params.centerId) {
    throw new Error("centerId is required to list videos");
  }
  const normalizedQuery = params.q?.trim() || undefined;
  const normalizedLegacySearch = params.search?.trim() || undefined;
  const normalizedProvider = params.source_provider?.trim() || undefined;

  const { data } = await http.get<RawVideosResponse>(
    basePath(params.centerId),
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        course_id: params.course_id ?? undefined,
        q: normalizedQuery,
        search: normalizedQuery ? undefined : normalizedLegacySearch,
        status: params.status ?? undefined,
        source_type: params.source_type ?? undefined,
        source_provider: normalizedProvider,
        created_from: params.created_from || undefined,
        created_to: params.created_to || undefined,
      },
    },
  );
  assertEnvelopeSuccess(data, "Failed to retrieve videos.");

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getVideo(
  centerId: string | number,
  videoId: string | number,
): Promise<Video> {
  const { data } = await http.get<RawVideoResponse>(
    `${basePath(centerId)}/${videoId}`,
  );
  assertEnvelopeSuccess(data, "Failed to retrieve video.");
  return withResponseMessage((data?.data ?? data) as Video, data);
}

export async function createVideo(
  centerId: string | number,
  payload: CreateVideoFromUrlPayload,
): Promise<Video> {
  const { data } = await http.post<RawVideoResponse>(
    basePath(centerId),
    payload,
  );
  assertEnvelopeSuccess(data, "Failed to create video.");
  return withResponseMessage((data?.data ?? data) as Video, data);
}

export async function createVideoUpload(
  centerId: string | number,
  payload: CreateVideoUploadPayload,
): Promise<VideoCreateUploadResult> {
  const { data } = await http.post<RawVideoCreateUploadResponse>(
    `${basePath(centerId)}/create-upload`,
    payload,
  );
  assertEnvelopeSuccess(data, "Failed to create upload session.");

  const result = (data?.data ?? data) as VideoCreateUploadResult;
  return withResponseMessage(result, data);
}

export async function createVideoUploadSession(
  centerId: string | number,
  payload: CreateVideoUploadSessionPayload,
): Promise<VideoUploadSession> {
  const { data } = await http.post<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions`,
    payload,
  );
  assertEnvelopeSuccess(data, "Failed to create upload session.");
  return withResponseMessage((data?.data ?? data) as VideoUploadSession, data);
}

export async function listVideoUploadSessions(
  params: ListVideoUploadSessionsParams,
): Promise<PaginatedResponse<VideoUploadSession>> {
  if (!params.centerId) {
    throw new Error("centerId is required to list video upload sessions");
  }

  const { data } = await http.get<RawVideoUploadSessionsResponse>(
    `${basePath(params.centerId)}/upload-sessions`,
    {
      params: {
        status: params.status || undefined,
        page: params.page,
        per_page: params.per_page,
      },
    },
  );
  assertEnvelopeSuccess(data, "Failed to retrieve upload sessions.");

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getVideoUploadSession(
  centerId: string | number,
  uploadSessionId: string | number,
): Promise<VideoUploadSession> {
  const { data } = await http.get<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions/${uploadSessionId}`,
  );
  assertEnvelopeSuccess(data, "Failed to retrieve upload session.");
  return withResponseMessage((data?.data ?? data) as VideoUploadSession, data);
}

export async function previewVideo(
  centerId: string | number,
  videoId: string | number,
): Promise<VideoPreviewResponse> {
  const { data } = await http.post<RawVideoPreviewResponse>(
    `${basePath(centerId)}/${videoId}/preview`,
  );
  assertEnvelopeSuccess(data, "Failed to generate preview URL.");

  return withResponseMessage(
    (data?.data ?? data) as VideoPreviewResponse,
    data,
  );
}

export async function updateVideo(
  centerId: string | number,
  videoId: string | number,
  payload: UpdateVideoPayload,
): Promise<Video> {
  const { data } = await http.put<RawVideoResponse>(
    `${basePath(centerId)}/${videoId}`,
    payload,
  );
  assertEnvelopeSuccess(data, "Failed to update video.");
  return withResponseMessage((data?.data ?? data) as Video, data);
}

export async function uploadVideoThumbnail(
  centerId: string | number,
  videoId: string | number,
  thumbnail: File | Blob,
): Promise<Video> {
  const formData = new FormData();
  formData.append("thumbnail", thumbnail);

  const { data } = await http.post<RawVideoResponse>(
    `${basePath(centerId)}/${videoId}/thumbnail`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  assertEnvelopeSuccess(data, "Failed to upload video thumbnail.");
  return withResponseMessage((data?.data ?? data) as Video, data);
}

export async function clearVideoThumbnail(
  centerId: string | number,
  videoId: string | number,
): Promise<Video> {
  const { data } = await http.delete<RawVideoResponse>(
    `${basePath(centerId)}/${videoId}/thumbnail`,
  );
  assertEnvelopeSuccess(data, "Failed to reset video thumbnail.");
  return withResponseMessage((data?.data ?? data) as Video, data);
}

export async function deleteVideo(
  centerId: string | number,
  videoId: string | number,
): Promise<AdminActionResult> {
  const { data } = await http.delete(`${basePath(centerId)}/${videoId}`);
  return normalizeAdminActionResult(data);
}
