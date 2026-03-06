import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  clearVideoThumbnail,
  createVideo,
  createVideoUpload,
  createVideoUploadSession,
  deleteVideo,
  getVideo,
  getVideoUploadSession,
  listVideoUploadSessions,
  listVideos,
  previewVideo,
  uploadVideoThumbnail,
  updateVideo,
  type CreateVideoFromUrlPayload,
  type CreateVideoUploadPayload,
  type CreateVideoUploadSessionPayload,
  type ListVideoUploadSessionsParams,
  type ListVideosParams,
  type UpdateVideoPayload,
} from "../services/videos.service";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  Video,
  VideoCreateUploadResult,
  VideoPreviewResponse,
  VideoUploadSession,
} from "@/features/videos/types/video";
import type { AdminActionResult } from "@/lib/admin-response";

type UseVideosOptions = Omit<
  UseQueryOptions<PaginatedResponse<Video>>,
  "queryKey" | "queryFn"
>;

export function useVideos(
  params: ListVideosParams,
  options?: UseVideosOptions,
) {
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

type UseVideoUploadSessionsOptions = Omit<
  UseQueryOptions<PaginatedResponse<VideoUploadSession>>,
  "queryKey" | "queryFn"
>;

export function useVideoUploadSessions(
  params: ListVideoUploadSessionsParams,
  options?: UseVideoUploadSessionsOptions,
) {
  return useQuery({
    queryKey: ["video-upload-sessions", params.centerId, params],
    queryFn: () => listVideoUploadSessions(params),
    enabled: !!params.centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseVideoUploadSessionOptions = Omit<
  UseQueryOptions<VideoUploadSession>,
  "queryKey" | "queryFn"
>;

export function useVideoUploadSession(
  centerId: string | number | undefined,
  uploadSessionId: string | number | undefined,
  options?: UseVideoUploadSessionOptions,
) {
  return useQuery({
    queryKey: ["video-upload-session", centerId, uploadSessionId],
    queryFn: () => getVideoUploadSession(centerId!, uploadSessionId!),
    enabled: !!centerId && !!uploadSessionId,
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
      payload: CreateVideoFromUrlPayload;
    }): Promise<Video> => createVideo(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
    },
  });
}

export function useCreateVideoUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateVideoUploadPayload;
    }): Promise<VideoCreateUploadResult> =>
      createVideoUpload(centerId, payload),
    onSuccess: (result, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
      if (result.video?.id != null) {
        queryClient.invalidateQueries({
          queryKey: ["video", centerId, result.video.id],
        });
      }
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

export function useUploadVideoThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      videoId,
      thumbnail,
    }: {
      centerId: string | number;
      videoId: string | number;
      thumbnail: File | Blob;
    }) => uploadVideoThumbnail(centerId, videoId, thumbnail),
    onSuccess: (_, { centerId, videoId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
      queryClient.invalidateQueries({ queryKey: ["video", centerId, videoId] });
    },
  });
}

export function useClearVideoThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      videoId,
    }: {
      centerId: string | number;
      videoId: string | number;
    }) => clearVideoThumbnail(centerId, videoId),
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
    }): Promise<AdminActionResult> => deleteVideo(centerId, videoId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
    },
  });
}

export function useCreateVideoUploadSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateVideoUploadSessionPayload;
    }): Promise<VideoUploadSession> =>
      createVideoUploadSession(centerId, payload),
    onSuccess: (_, { centerId, payload }) => {
      queryClient.invalidateQueries({
        queryKey: ["video-upload-sessions", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video", centerId, payload.video_id],
      });
    },
  });
}

export function usePreviewVideo() {
  return useMutation({
    mutationFn: ({
      centerId,
      videoId,
    }: {
      centerId: string | number;
      videoId: string | number;
    }): Promise<VideoPreviewResponse> => previewVideo(centerId, videoId),
  });
}
