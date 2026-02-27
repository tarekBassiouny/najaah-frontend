"use client";

import { useEffect, useMemo, useState } from "react";
import { useVideos } from "@/features/videos/hooks/use-videos";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date-time";
import type { Video } from "@/features/videos/types/video";
import {
  resolveVideoProviderLabel,
  resolveVideoThumbnailState,
} from "@/features/videos/lib/video-thumbnail";

const DEFAULT_PER_PAGE = 10;

type VideoStatusVariant =
  | "success"
  | "warning"
  | "secondary"
  | "error"
  | "default";

const statusConfig: Record<
  string,
  {
    variant: VideoStatusVariant;
    label: string;
  }
> = {
  ready: { variant: "success", label: "Ready" },
  pending: { variant: "warning", label: "Pending" },
  uploading: { variant: "warning", label: "Uploading" },
  processing: { variant: "warning", label: "Processing" },
  failed: { variant: "error", label: "Failed" },
};

type VideosTableProps = {
  centerId?: string | number;
  onView?: (_video: Video) => void;
  onPreview?: (_video: Video) => void;
  onRetryUpload?: (_video: Video) => void;
  onEdit?: (_video: Video) => void;
  onDelete?: (_video: Video) => void;
  onBulkRetryUpload?: (_videos: Video[]) => void;
  onBulkDelete?: (_videos: Video[]) => void;
};

function resolveVideoTags(video: Video) {
  if (!Array.isArray(video.tags)) return [];
  return video.tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function resolveVideoTitle(video: Video) {
  return (
    video.title ??
    video.title_translations?.en ??
    video.title_translations?.ar ??
    "—"
  );
}

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function resolveEncodingStatus(video: Video) {
  return (
    normalizeStatus(video.encoding_status_key) ||
    normalizeStatus(video.status_key) ||
    normalizeStatus(video.status)
  );
}

function resolveLifecycleStatus(video: Video) {
  return normalizeStatus(video.lifecycle_status_key) || "pending";
}

function resolveTableStatus(video: Video) {
  const encodingStatus = resolveEncodingStatus(video);
  if (encodingStatus && encodingStatus !== "unknown") {
    return {
      key: encodingStatus,
      label: video.encoding_status_label ?? video.status_label ?? null,
    };
  }

  const lifecycleStatus = resolveLifecycleStatus(video);
  return {
    key: lifecycleStatus,
    label: video.lifecycle_status_label ?? video.status_label ?? null,
  };
}

function resolveDurationSeconds(video: Video) {
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

function formatDuration(seconds: number | null) {
  if (seconds == null || Number.isNaN(seconds)) return "—";

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

function resolveSourceMode(video: Video) {
  const sourceType = String(video.source_type ?? "")
    .trim()
    .toLowerCase();

  if (sourceType === "1" || sourceType === "upload" || sourceType === "bunny") {
    return "Upload";
  }

  if (sourceType === "0" || sourceType === "url") {
    return "URL";
  }

  return video.source_url ? "URL" : "Upload";
}

function getStatusBadge(status: string, statusLabel?: string | null) {
  const fallbackLabel = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Unknown";
  const explicitLabel =
    typeof statusLabel === "string" && statusLabel.trim()
      ? statusLabel.trim()
      : null;

  const config = statusConfig[status] ?? {
    variant: "default" as const,
    label: fallbackLabel,
  };

  return {
    ...config,
    label: explicitLabel ?? config.label,
  };
}

function isUploadSourceVideo(video: Video) {
  const sourceType = String(video.source_type ?? "")
    .trim()
    .toLowerCase();
  return (
    sourceType === "1" || sourceType === "upload" || sourceType === "bunny"
  );
}

function canRetryVideoUpload(video: Video) {
  return (
    resolveEncodingStatus(video) === "failed" && isUploadSourceVideo(video)
  );
}

export function VideosTable({
  centerId: centerIdProp,
  onView,
  onPreview,
  onRetryUpload,
  onEdit,
  onDelete,
  onBulkRetryUpload,
  onBulkDelete,
}: VideosTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Record<string, Video>>(
    {},
  );
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<
    Record<string, true>
  >({});

  const params = useMemo(
    () => ({
      centerId: centerId ?? undefined,
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [centerId, page, perPage, query],
  );

  const { data, isLoading, isError, isFetching } = useVideos(params, {
    refetchInterval: (query) => {
      const rows = query.state.data?.items ?? [];
      const hasProcessingVideos = rows.some((video) => {
        const status = resolveEncodingStatus(video);
        return (
          status === "pending" ||
          status === "uploading" ||
          status === "processing"
        );
      });
      return hasProcessingVideos ? 15000 : false;
    },
    refetchIntervalInBackground: true,
  });
  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState =
    !isLoadingState && !isError && items.length === 0 && Boolean(centerId);
  const selectedIds = useMemo(
    () => Object.keys(selectedVideos),
    [selectedVideos],
  );
  const selectedCount = selectedIds.length;
  const selectedVideosList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedVideos[id])
        .filter((video): video is Video => Boolean(video)),
    [selectedIds, selectedVideos],
  );
  const pageVideoIds = useMemo(
    () => items.map((video) => String(video.id)),
    [items],
  );
  const isAllPageSelected =
    pageVideoIds.length > 0 && pageVideoIds.every((id) => selectedVideos[id]);
  const hasActions = Boolean(
    onView || onPreview || onRetryUpload || onEdit || onDelete,
  );
  const hasBulkActions = Boolean(onBulkDelete || onBulkRetryUpload);
  const showSelection = hasBulkActions;
  const columnCount = (showSelection ? 9 : 8) + (hasActions ? 1 : 0);
  const retryEligibleSelectedVideos = useMemo(
    () => selectedVideosList.filter((video) => canRetryVideoUpload(video)),
    [selectedVideosList],
  );

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [centerId]);

  useEffect(() => {
    setSelectedVideos({});
  }, [centerId, page, perPage, query]);

  useEffect(() => {
    setFailedThumbnailIds({});
  }, [centerId, page, perPage, query]);

  const toggleVideoSelection = (video: Video) => {
    const videoId = String(video.id);
    setSelectedVideos((prev) => {
      if (prev[videoId]) {
        const { [videoId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [videoId]: video };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedVideos((prev) => {
        if (pageVideoIds.length === 0) return prev;
        const next = { ...prev };
        pageVideoIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedVideos((prev) => {
      const next = { ...prev };
      items.forEach((video) => {
        next[String(video.id)] = video;
      });
      return next;
    });
  };

  return (
    <ListingCard>
      <ListingFilters
        activeCount={search.trim() ? 1 : 0}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={search.trim().length > 0}
        onClear={() => {
          setSearch("");
          setQuery("");
          setPage(1);
        }}
        summary={
          centerId ? (
            <>
              {total} {total === 1 ? "video" : "videos"}
            </>
          ) : (
            <>Select a center to view videos.</>
          )
        }
        gridClassName="grid-cols-1 md:grid-cols-2"
      >
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos..."
            className="pl-10 pr-9 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
            disabled={!centerId}
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPage(1);
              if (query) setQuery("");
            }}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
              search.trim().length > 0
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            aria-label="Clear search"
            tabIndex={search.trim().length > 0 ? 0 : -1}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <CenterPicker
          className="w-full min-w-0"
          hideWhenCenterScoped={true}
          selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />
      </ListingFilters>

      {!centerId ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Select a center to view videos.
        </div>
      ) : isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load videos. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-x-auto transition-opacity",
            isFetching && !isLoading ? "opacity-60" : "opacity-100",
          )}
        >
          <Table className="min-w-[1320px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                {showSelection ? (
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                      checked={isAllPageSelected}
                      onChange={toggleAllSelections}
                      disabled={isLoadingState || items.length === 0}
                      aria-label="Select all videos on this page"
                    />
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">Thumbnail</TableHead>
                <TableHead className="font-medium">Video</TableHead>
                <TableHead className="font-medium">Tags</TableHead>
                <TableHead className="font-medium">Provider</TableHead>
                <TableHead className="font-medium">Duration</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Uploaded By</TableHead>
                <TableHead className="font-medium">Updated</TableHead>
                {hasActions ? (
                  <TableHead className="w-10 text-right font-medium">
                    Actions
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      {showSelection ? (
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Skeleton className="h-10 w-16 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      {hasActions ? (
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-48">
                    <EmptyState
                      title={query ? "No videos found" : "No videos yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Create videos to get started"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((video, index) => {
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;
                  const title = resolveVideoTitle(video);
                  const videoId = String(video.id);
                  const thumbnailState = resolveVideoThumbnailState(video);
                  const canRenderThumbnailImage = Boolean(
                    thumbnailState.imageUrl && !failedThumbnailIds[videoId],
                  );
                  const tags = resolveVideoTags(video);
                  const providerLabel = resolveVideoProviderLabel(video);
                  const sourceMode = resolveSourceMode(video);
                  const durationSeconds = resolveDurationSeconds(video);
                  const tableStatus = resolveTableStatus(video);
                  const tableStatusBadge = getStatusBadge(
                    tableStatus.key,
                    tableStatus.label,
                  );
                  const creatorName =
                    typeof video.creator?.name === "string" &&
                    video.creator.name.trim()
                      ? video.creator.name.trim()
                      : "—";
                  const centerName =
                    typeof video.center?.name === "string" &&
                    video.center.name.trim()
                      ? video.center.name.trim()
                      : null;

                  return (
                    <TableRow
                      key={video.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      {showSelection ? (
                        <TableCell>
                          <input
                            type="checkbox"
                            className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                            checked={Boolean(selectedVideos[String(video.id)])}
                            onChange={() => toggleVideoSelection(video)}
                            aria-label={`Select ${title}`}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        {canRenderThumbnailImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnailState.imageUrl ?? undefined}
                            alt={`${title} thumbnail`}
                            className="h-10 w-16 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                            loading="lazy"
                            onError={() => {
                              setFailedThumbnailIds((prev) => ({
                                ...prev,
                                [videoId]: true,
                              }));
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-16 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-1 text-center dark:border-gray-700 dark:bg-gray-900">
                            <span className="line-clamp-1 text-[9px] font-medium text-gray-500 dark:text-gray-400">
                              {thumbnailState.fallbackLabel}
                            </span>
                            <span className="line-clamp-1 text-[8px] text-gray-400 dark:text-gray-500">
                              {thumbnailState.fallbackHint ?? "No thumbnail"}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        <div className="space-y-1">
                          <p className="line-clamp-1 font-medium">{title}</p>
                          {typeof video.description === "string" &&
                          video.description.trim() ? (
                            <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                              {video.description.trim()}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {tags.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="max-w-[120px] truncate text-[10px]"
                                title={tag}
                              >
                                {tag}
                              </Badge>
                            ))}
                            {tags.length > 2 ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                                title={tags.slice(2).join(", ")}
                              >
                                +{tags.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {providerLabel}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {sourceMode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDuration(durationSeconds)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tableStatusBadge.variant}>
                          {tableStatusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <p className="line-clamp-1 font-medium text-gray-700 dark:text-gray-300">
                            {creatorName}
                          </p>
                          <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                            {centerName ?? "Najaah App"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <p>
                            {video.updated_at
                              ? formatDateTime(video.updated_at)
                              : "—"}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Created{" "}
                            {video.created_at
                              ? formatDateTime(video.created_at)
                              : "—"}
                          </p>
                        </div>
                      </TableCell>
                      {hasActions ? (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === video.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? video.id : null)
                              }
                            >
                              <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                                ⋮
                              </DropdownTrigger>
                              <DropdownContent
                                align="end"
                                className={cn(
                                  "w-52 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                  shouldOpenUp && "bottom-full mb-2 mt-0",
                                )}
                              >
                                {onView ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onView(video);
                                    }}
                                  >
                                    View details
                                  </button>
                                ) : null}
                                {onPreview ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onPreview(video);
                                    }}
                                  >
                                    Preview
                                  </button>
                                ) : null}
                                {onRetryUpload && canRetryVideoUpload(video) ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onRetryUpload(video);
                                    }}
                                  >
                                    Retry upload
                                  </button>
                                ) : null}
                                {onEdit ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit(video);
                                    }}
                                  >
                                    Edit video
                                  </button>
                                ) : null}
                                {onDelete ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDelete(video);
                                    }}
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCount > 0 && hasBulkActions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBulkRetryUpload ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkRetryUpload(retryEligibleSelectedVideos)}
                disabled={
                  isLoadingState || retryEligibleSelectedVideos.length === 0
                }
                title={
                  retryEligibleSelectedVideos.length === 0
                    ? "Select failed upload-source videos to retry"
                    : undefined
                }
              >
                Retry Uploads
              </Button>
            ) : null}
            {onBulkDelete ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkDelete(selectedVideosList)}
                disabled={isLoadingState}
                className="text-red-600 hover:text-red-600"
              >
                Delete Selected
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isError && maxPage > 1 ? (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <PaginationControls
            page={page}
            lastPage={maxPage}
            isFetching={isFetching}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            size="sm"
          />
        </div>
      ) : null}
    </ListingCard>
  );
}
