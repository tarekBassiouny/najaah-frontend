import { http } from "@/lib/http";
import type { Video, VideoUploadSession } from "@/features/videos/types/video";
import type { PaginatedResponse } from "@/types/pagination";

export type ListVideosParams = {
  centerId?: string | number;
  page?: number;
  per_page?: number;
  search?: string;
};

export type CreateVideoPayload = {
  title?: string;
  description?: string;
  url?: string;
  duration?: number | string;
  [key: string]: unknown;
};

export type UpdateVideoPayload = Partial<CreateVideoPayload> & {
  status?: string;
};

type RawVideosResponse = {
  data?: Video[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawVideoResponse = {
  data?: Video;
};

type RawUploadSessionResponse = {
  data?: VideoUploadSession;
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/videos`;
}

export async function listVideos(
  params: ListVideosParams,
): Promise<PaginatedResponse<Video>> {
  if (!params.centerId) {
    throw new Error("centerId is required to list videos");
  }
  const { data } = await http.get<RawVideosResponse>(basePath(params.centerId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
    },
  });

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
  return data?.data ?? (data as unknown as Video);
}

export async function createVideo(
  centerId: string | number,
  payload: CreateVideoPayload,
): Promise<Video> {
  const { data } = await http.post<RawVideoResponse>(
    basePath(centerId),
    payload,
  );
  return data?.data ?? (data as unknown as Video);
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
  return data?.data ?? (data as unknown as Video);
}

export async function deleteVideo(
  centerId: string | number,
  videoId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId)}/${videoId}`);
}

export async function createVideoUploadSession(
  centerId: string | number,
  payload: Record<string, unknown> = {},
): Promise<VideoUploadSession> {
  const { data } = await http.post<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions`,
    payload,
  );
  return data?.data ?? (data as unknown as VideoUploadSession);
}
