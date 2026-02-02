import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  createVideo,
  createVideoUploadSession,
  deleteVideo,
  getVideo,
  listVideos,
  updateVideo,
  type CreateVideoPayload,
  type ListVideosParams,
  type UpdateVideoPayload,
} from "../services/videos.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Video } from "@/features/videos/types/video";

type UseVideosOptions = Omit<
  UseQueryOptions<PaginatedResponse<Video>>,
  "queryKey" | "queryFn"
>;

export function useVideos(params: ListVideosParams, options?: UseVideosOptions) {
  return useQuery({
    queryKey: ["videos", params.centerId, params],
    queryFn: () => listVideos(params),
    enabled: !!params.centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseVideoOptions = Omit<UseQueryOptions<Video>, "queryKey" | "queryFn">;

export function useVideo(
  centerId: string | number | undefined,
  videoId: string | number | undefined,
  options?: UseVideoOptions,
) {
  return useQuery({
    queryKey: ["video", centerId, videoId],
    queryFn: () => getVideo(centerId!, videoId!),
    enabled: !!centerId && !!videoId,
    ...options,
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateVideoPayload;
    }) => createVideo(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      videoId,
      payload,
    }: {
      centerId: string | number;
      videoId: string | number;
      payload: UpdateVideoPayload;
    }) => updateVideo(centerId, videoId, payload),
    onSuccess: (_, { centerId, videoId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
      queryClient.invalidateQueries({ queryKey: ["video", centerId, videoId] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      videoId,
    }: {
      centerId: string | number;
      videoId: string | number;
    }) => deleteVideo(centerId, videoId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
    },
  });
}

export function useCreateVideoUploadSession() {
  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload?: Record<string, unknown>;
    }) => createVideoUploadSession(centerId, payload ?? {}),
  });
}
