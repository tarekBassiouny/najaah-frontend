"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideo } from "@/features/videos/hooks/use-videos";
import type { Video, VideoUploadSession } from "@/features/videos/types/video";
import { formatDateTime } from "@/lib/format-date-time";
import {
  resolveVideoProviderLabel,
  resolveVideoThumbnailState,
} from "@/features/videos/lib/video-thumbnail";
import { useTranslation } from "@/features/localization";
import { VideoTranscriptPanel } from "./VideoTranscriptPanel";

type VideoDetailsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId?: string | number | null;
  video?: Video | null;
};

function resolveTitle(video?: Video | null) {
  return (
    video?.title ??
    video?.title_translations?.en ??
    video?.title_translations?.ar ??
    null
  );
}

function resolveDescription(video?: Video | null) {
  return (
    video?.description ??
    video?.description_translations?.en ??
    video?.description_translations?.ar ??
    null
  );
}

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function resolveEncodingStatus(video?: Video | null) {
  return (
    normalizeStatus(video?.encoding_status_key) ||
    normalizeStatus(video?.status_key) ||
    normalizeStatus(video?.status) ||
    "unknown"
  );
}

function resolveLifecycleStatus(video?: Video | null) {
  return normalizeStatus(video?.lifecycle_status_key) || "unknown";
}

function resolveStatusBadge(
  status: string,
  statusLabel: string | null | undefined,
  labels: {
    ready: string;
    failed: string;
    pending: string;
    uploading: string;
    processing: string;
    unknown: string;
  },
) {
  const explicitLabel =
    typeof statusLabel === "string" && statusLabel.trim()
      ? statusLabel.trim()
      : null;

  if (status === "ready")
    return {
      variant: "success" as const,
      label: explicitLabel ?? labels.ready,
    };
  if (status === "failed")
    return {
      variant: "error" as const,
      label: explicitLabel ?? labels.failed,
    };
  if (status === "pending") {
    return {
      variant: "warning" as const,
      label: explicitLabel ?? labels.pending,
    };
  }
  if (status === "uploading") {
    return {
      variant: "warning" as const,
      label: explicitLabel ?? labels.uploading,
    };
  }
  if (status === "processing") {
    return {
      variant: "warning" as const,
      label: explicitLabel ?? labels.processing,
    };
  }
  if (status === "unknown") {
    return {
      variant: "secondary" as const,
      label: explicitLabel ?? labels.unknown,
    };
  }

  return {
    variant: "secondary" as const,
    label:
      explicitLabel ??
      (status
        ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
        : labels.unknown),
  };
}

function resolveSourceMode(video?: Video | null): "upload" | "url" {
  const sourceType = String(video?.source_type ?? "")
    .trim()
    .toLowerCase();

  if (sourceType === "1" || sourceType === "upload" || sourceType === "bunny") {
    return "upload";
  }

  if (sourceType === "0" || sourceType === "url") {
    return "url";
  }

  return video?.source_url ? "url" : "upload";
}

function resolveDurationSeconds(video?: Video | null) {
  if (!video) return null;

  if (typeof video.duration_seconds === "number") {
    return video.duration_seconds;
  }

  if (typeof video.duration === "number") {
    return video.duration;
  }

  if (typeof video.duration === "string" && video.duration.trim()) {
    const parsed = Number(video.duration);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

function formatDuration(seconds: number | null, emptyValue: string) {
  if (seconds == null || Number.isNaN(seconds)) return emptyValue;

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function resolveUploadSessionStatus(session: VideoUploadSession) {
  return normalizeStatus(session.upload_status_key) || "unknown";
}

function resolveUploadSessionError(session: VideoUploadSession) {
  const message =
    (typeof session.error_message === "string" && session.error_message.trim()
      ? session.error_message
      : null) ??
    (typeof session.last_error_message === "string" &&
    session.last_error_message.trim()
      ? session.last_error_message
      : null);

  return message?.trim() ?? null;
}

export function VideoDetailsDialog({
  open,
  onOpenChange,
  centerId,
  video,
}: VideoDetailsDialogProps) {
  const { t } = useTranslation();
  const videoId = video?.id;
  const shouldFetchDetail = Boolean(open && centerId && videoId != null);
  const {
    data: fullVideo,
    isLoading,
    isFetching,
    isError,
  } = useVideo(centerId ?? undefined, videoId ?? undefined, {
    enabled: shouldFetchDetail,
  });

  const activeVideo = fullVideo ?? video;
  const title =
    resolveTitle(activeVideo) ??
    t("pages.videos.dialogs.details.titleFallback");
  const description =
    resolveDescription(activeVideo) ??
    t("pages.videos.dialogs.details.descriptionFallback");
  const emptyValue = t("pages.videos.dialogs.details.emptyValue");
  const statusLabels = {
    ready: t("pages.videos.dialogs.details.status.ready"),
    failed: t("pages.videos.dialogs.details.status.failed"),
    pending: t("pages.videos.dialogs.details.status.pending"),
    uploading: t("pages.videos.dialogs.details.status.uploading"),
    processing: t("pages.videos.dialogs.details.status.processing"),
    unknown: t("pages.videos.dialogs.details.status.unknown"),
  };
  const encodingStatus = resolveEncodingStatus(activeVideo);
  const lifecycleStatus = resolveLifecycleStatus(activeVideo);
  const encodingBadge = resolveStatusBadge(
    encodingStatus,
    activeVideo?.encoding_status_label,
    statusLabels,
  );
  const lifecycleBadge = resolveStatusBadge(
    lifecycleStatus,
    activeVideo?.lifecycle_status_label,
    statusLabels,
  );
  const sourceMode = resolveSourceMode(activeVideo);
  const duration = formatDuration(
    resolveDurationSeconds(activeVideo),
    emptyValue,
  );
  const thumbnailState = activeVideo
    ? resolveVideoThumbnailState(activeVideo)
    : {
        imageUrl: null,
        providerLabel: t("pages.videos.dialogs.details.thumbnail.external"),
        fallbackLabel: t("pages.videos.dialogs.details.thumbnail.videoLink"),
        fallbackHint: t("pages.videos.dialogs.details.thumbnail.noThumbnail"),
        source: "placeholder" as const,
      };
  const sourceUrl =
    typeof activeVideo?.source_url === "string" && activeVideo.source_url.trim()
      ? activeVideo.source_url.trim()
      : null;
  const creatorName =
    typeof activeVideo?.creator?.name === "string" &&
    activeVideo.creator.name.trim()
      ? activeVideo.creator.name.trim()
      : emptyValue;
  const centerName =
    typeof activeVideo?.center?.name === "string" &&
    activeVideo.center.name.trim()
      ? activeVideo.center.name.trim()
      : emptyValue;
  const uploadSessions = useMemo(() => {
    const detailSessions = Array.isArray(fullVideo?.upload_sessions)
      ? fullVideo.upload_sessions
      : [];
    const rowSessions = Array.isArray(video?.upload_sessions)
      ? video.upload_sessions
      : [];

    const rows =
      detailSessions.length > 0
        ? detailSessions
        : rowSessions.length > 0
          ? rowSessions
          : [];

    return [...rows].sort((left, right) => {
      const leftParsed = left.created_at ? Date.parse(left.created_at) : 0;
      const rightParsed = right.created_at ? Date.parse(right.created_at) : 0;
      const leftTime = Number.isFinite(leftParsed) ? leftParsed : 0;
      const rightTime = Number.isFinite(rightParsed) ? rightParsed : 0;
      return rightTime - leftTime;
    });
  }, [fullVideo?.upload_sessions, video?.upload_sessions]);
  const shouldShowLoading = isLoading && !activeVideo;
  const isRefreshing = isFetching && Boolean(activeVideo);
  const [thumbnailLoadFailed, setThumbnailLoadFailed] = useState(false);

  useEffect(() => {
    setThumbnailLoadFailed(false);
  }, [activeVideo?.id, thumbnailState.imageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <span>{title}</span>
            {isRefreshing ? (
              <Badge variant="secondary" className="text-[10px]">
                {t("pages.videos.dialogs.details.refreshing")}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {shouldShowLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            {isError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
                {t("pages.videos.dialogs.details.cachedWarning")}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.encoding")}
                </p>
                <Badge variant={encodingBadge.variant}>
                  {encodingBadge.label}
                </Badge>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.lifecycle")}
                </p>
                <Badge variant={lifecycleBadge.variant}>
                  {lifecycleBadge.label}
                </Badge>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.provider")}
                </p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {activeVideo
                    ? resolveVideoProviderLabel(activeVideo)
                    : emptyValue}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.sourceMode")}
                </p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {t(`pages.videos.dialogs.details.sourceMode.${sourceMode}`)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.duration")}
                </p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {duration}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.videoId")}
                </p>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  {activeVideo?.id != null
                    ? String(activeVideo.id)
                    : emptyValue}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              {thumbnailState.imageUrl && !thumbnailLoadFailed ? (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.videos.dialogs.details.fields.thumbnail")}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailState.imageUrl}
                    alt={t("pages.videos.dialogs.details.thumbnail.alt", {
                      title,
                    })}
                    className="h-44 w-full rounded-md object-cover"
                    onError={() => setThumbnailLoadFailed(true)}
                  />
                </div>
              ) : (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.videos.dialogs.details.fields.thumbnail")}
                  </p>
                  <div className="flex h-44 w-full flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 text-center dark:border-gray-700 dark:bg-gray-900/60">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {thumbnailState.fallbackLabel}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {thumbnailState.fallbackHint ??
                        t(
                          "pages.videos.dialogs.details.thumbnail.noThumbnailAvailable",
                        )}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.videos.dialogs.details.fields.uploadedBy")}
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {creatorName}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.videos.dialogs.details.fields.center")}
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {centerName}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.videos.dialogs.details.fields.createdAt")}
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {activeVideo?.created_at
                      ? formatDateTime(activeVideo.created_at)
                      : emptyValue}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.videos.dialogs.details.fields.updatedAt")}
                  </p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {activeVideo?.updated_at
                      ? formatDateTime(activeVideo.updated_at)
                      : emptyValue}
                  </p>
                </div>
              </div>
            </div>

            {sourceUrl ? (
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.sourceUrl")}
                </p>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="line-clamp-1 font-medium text-primary hover:underline"
                >
                  {sourceUrl}
                </a>
              </div>
            ) : null}

            <VideoTranscriptPanel centerId={centerId} video={activeVideo} />

            <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {t("pages.videos.dialogs.details.fields.uploadSessions")}
                </p>
                <Badge variant="secondary">{uploadSessions.length}</Badge>
              </div>
              {uploadSessions.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.videos.dialogs.details.noUploadSessions")}
                </p>
              ) : (
                <div className="space-y-2">
                  {uploadSessions.map((session) => {
                    const sessionStatus = resolveUploadSessionStatus(session);
                    const sessionBadge = resolveStatusBadge(
                      sessionStatus,
                      session.upload_status_label,
                      statusLabels,
                    );
                    const sessionError = resolveUploadSessionError(session);
                    const progress =
                      typeof session.progress_percent === "number"
                        ? Math.max(0, Math.min(100, session.progress_percent))
                        : null;

                    return (
                      <div
                        key={session.id}
                        className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {t("pages.videos.dialogs.details.sessionLabel", {
                              id: String(session.id),
                            })}
                          </p>
                          <Badge variant={sessionBadge.variant}>
                            {sessionBadge.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {t("pages.videos.dialogs.details.progressLabel", {
                              value:
                                progress != null
                                  ? `${Math.round(progress)}%`
                                  : emptyValue,
                            })}
                          </span>
                          <span>
                            {t("pages.videos.dialogs.details.createdLabel", {
                              value: session.created_at
                                ? formatDateTime(session.created_at)
                                : emptyValue,
                            })}
                          </span>
                        </div>
                        {sessionError ? (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {sessionError}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
