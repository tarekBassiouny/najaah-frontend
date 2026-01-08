import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listVideos, type ListVideosParams } from "../services/videos.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Video } from "@/features/videos/types/video";

type UseVideosOptions = Omit<
  UseQueryOptions<PaginatedResponse<Video>>,
  "queryKey" | "queryFn"
>;

export function useVideos(params: ListVideosParams, options?: UseVideosOptions) {
  return useQuery({
    queryKey: ["videos", params],
    queryFn: () => listVideos(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
