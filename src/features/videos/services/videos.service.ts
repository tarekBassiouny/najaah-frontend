import { http } from "@/lib/http";
import type { Video } from "@/features/videos/types/video";
import type { PaginatedResponse } from "@/types/pagination";

export type ListVideosParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

type RawVideosResponse = {
  data?: Video[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listVideos(
  params: ListVideosParams,
): Promise<PaginatedResponse<Video>> {
  const { data } = await http.get<RawVideosResponse>("/api/v1/admin/videos", {
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
