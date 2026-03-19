"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCenterCourses } from "@/features/courses/hooks/use-courses";
import { useVideos } from "@/features/videos/hooks/use-videos";
import { useModal } from "@/components/ui/modal-store";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/features/localization";
import { useLocale } from "@/features/localization/locale-context";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date-time";
import { triggerBrowserDownload } from "@/features/video-code-batches/lib/download-file";
import { buildVideoCodeBatchExportFilename } from "@/features/video-code-batches/lib/export-filename";
import {
  exportVideoCodeBatchCsv,
  exportVideoCodeBatchPdf,
} from "@/features/video-code-batches/services/video-code-batches.service";
import { useVideoCodeBatches } from "@/features/video-code-batches/hooks/use-video-code-batches";
import type {
  VideoCodeBatch,
  VideoCodeBatchStatus,
} from "@/features/video-code-batches/types/video-code-batch";
import { CreateVideoCodeBatchDialog } from "@/features/video-code-batches/components/CreateVideoCodeBatchDialog";
import { ExpandVideoCodeBatchDialog } from "@/features/video-code-batches/components/ExpandVideoCodeBatchDialog";
import { CloseVideoCodeBatchDialog } from "@/features/video-code-batches/components/CloseVideoCodeBatchDialog";
import { SendVideoCodeBatchWhatsappCsvDialog } from "@/features/video-code-batches/components/SendVideoCodeBatchWhatsappCsvDialog";

const DEFAULT_PER_PAGE = 10;
const ALL_FILTER_VALUE = "all";

type VideoCodeBatchesTableProps = {
  centerId: string | number;
  fixedCourseId?: string | number | null;
  hideHeader?: boolean;
};

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function resolveStatusMeta(
  status: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const normalized = normalizeStatus(status);
  if (normalized === "open") {
    return {
      label: t(
        "auto.features.video_code_batches.components.videocodebatchestable.statusOpen",
      ),
      variant: "success" as const,
    };
  }

  if (normalized === "closed") {
    return {
      label: t(
        "auto.features.video_code_batches.components.videocodebatchestable.statusClosed",
      ),
      variant: "default" as const,
    };
  }

  return {
    label:
      typeof status === "string" && status.trim()
        ? status
        : t(
            "auto.features.video_code_batches.components.videocodebatchestable.unknownStatus",
          ),
    variant: "secondary" as const,
  };
}

function resolveBatchTitle(
  batch: VideoCodeBatch,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  return (
    batch.batch_code ??
    t(
      "auto.features.video_code_batches.components.videocodebatchestable.batchWithId",
      {
        id: batch.id,
      },
    )
  );
}

export function VideoCodeBatchesTable({
  centerId,
  fixedCourseId = null,
  hideHeader = false,
}: VideoCodeBatchesTableProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const isRtl = locale === "ar";
  const { showToast } = useModal();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    fixedCourseId != null ? String(fixedCourseId) : ALL_FILTER_VALUE,
  );
  const [selectedVideoId, setSelectedVideoId] =
    useState<string>(ALL_FILTER_VALUE);
  const [selectedStatus, setSelectedStatus] =
    useState<string>(ALL_FILTER_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [activeDownloadKey, setActiveDownloadKey] = useState<string | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandBatch, setExpandBatch] = useState<VideoCodeBatch | null>(null);
  const [closeBatch, setCloseBatch] = useState<VideoCodeBatch | null>(null);
  const [whatsappBatch, setWhatsappBatch] = useState<VideoCodeBatch | null>(
    null,
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (fixedCourseId == null) return;
    setSelectedCourseId(String(fixedCourseId));
  }, [fixedCourseId]);

  useEffect(() => {
    setSelectedVideoId(ALL_FILTER_VALUE);
  }, [selectedCourseId]);

  const effectiveCourseId =
    fixedCourseId != null
      ? String(fixedCourseId)
      : selectedCourseId !== ALL_FILTER_VALUE
        ? selectedCourseId
        : undefined;

  const coursesQuery = useCenterCourses(
    {
      center_id: centerId,
      page: 1,
      per_page: 100,
      access_model: "video_code",
    },
    {
      enabled: true,
      staleTime: 60_000,
    },
  );

  const videosQuery = useVideos(
    {
      centerId,
      page: 1,
      per_page: 100,
      course_id: effectiveCourseId,
    },
    {
      enabled: Boolean(centerId),
      staleTime: 60_000,
    },
  );

  const batchesQuery = useVideoCodeBatches(
    centerId,
    {
      page,
      per_page: perPage,
      course_id: effectiveCourseId,
      video_id:
        selectedVideoId !== ALL_FILTER_VALUE ? selectedVideoId : undefined,
      status:
        selectedStatus !== ALL_FILTER_VALUE
          ? (selectedStatus as VideoCodeBatchStatus)
          : undefined,
      search: query || undefined,
    },
    {
      staleTime: 30_000,
    },
  );

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    return (coursesQuery.data?.items ?? []).map((course) => ({
      value: String(course.id),
      label:
        course.title ??
        course.name ??
        t(
          "auto.features.video_code_batches.components.videocodebatchestable.courseWithId",
          { id: course.id },
        ),
    }));
  }, [coursesQuery.data?.items, t]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    return (videosQuery.data?.items ?? []).map((video) => ({
      value: String(video.id),
      label:
        video.title ??
        video.title_translations?.en ??
        video.title_translations?.ar ??
        t(
          "auto.features.video_code_batches.components.videocodebatchestable.videoWithId",
          { id: video.id },
        ),
    }));
  }, [t, videosQuery.data?.items]);

  const items = batchesQuery.data?.items ?? [];
  const total = batchesQuery.data?.meta.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const isLoading = batchesQuery.isLoading;
  const isFetching = batchesQuery.isFetching;
  const isError = batchesQuery.isError;
  const activeFilterCount =
    (query.length > 0 ? 1 : 0) +
    (selectedStatus !== ALL_FILTER_VALUE ? 1 : 0) +
    (selectedVideoId !== ALL_FILTER_VALUE ? 1 : 0) +
    (fixedCourseId == null && selectedCourseId !== ALL_FILTER_VALUE ? 1 : 0);

  const handleExport = async (batch: VideoCodeBatch, format: "csv" | "pdf") => {
    const downloadKey = `${batch.id}-${format}`;
    setActiveDownloadKey(downloadKey);

    try {
      const response =
        format === "csv"
          ? await exportVideoCodeBatchCsv(centerId, batch.id)
          : await exportVideoCodeBatchPdf(centerId, batch.id);
      const fallbackName = buildVideoCodeBatchExportFilename(batch, format);
      triggerBrowserDownload(response.blob, response.filename ?? fallbackName);
      await batchesQuery.refetch();
      showToast(
        t(
          format === "csv"
            ? "auto.features.video_code_batches.components.videocodebatchestable.exportCsvSuccess"
            : "auto.features.video_code_batches.components.videocodebatchestable.exportPdfSuccess",
        ),
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : t(
              format === "csv"
                ? "auto.features.video_code_batches.components.videocodebatchestable.exportCsvFailed"
                : "auto.features.video_code_batches.components.videocodebatchestable.exportPdfFailed",
            ),
        "error",
      );
    } finally {
      setActiveDownloadKey(null);
      setOpenMenuId(null);
    }
  };

  const renderHeader = !hideHeader;

  return (
    <div className="space-y-4">
      {renderHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t(
                "auto.features.video_code_batches.components.videocodebatchestable.title",
              )}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                "auto.features.video_code_batches.components.videocodebatchestable.description",
              )}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            {t(
              "auto.features.video_code_batches.components.videocodebatchestable.createBatch",
            )}
          </Button>
        </div>
      ) : null}

      <ListingCard>
        <ListingFilters
          activeCount={activeFilterCount}
          isFetching={isFetching}
          isLoading={isLoading}
          hasActiveFilters={activeFilterCount > 0}
          onClear={() => {
            setSearch("");
            setQuery("");
            if (fixedCourseId == null) {
              setSelectedCourseId(ALL_FILTER_VALUE);
            }
            setSelectedVideoId(ALL_FILTER_VALUE);
            setSelectedStatus(ALL_FILTER_VALUE);
            setPage(1);
          }}
          summary={t(
            total === 1
              ? "auto.features.video_code_batches.components.videocodebatchestable.summarySingle"
              : "auto.features.video_code_batches.components.videocodebatchestable.summaryPlural",
            { count: total },
          )}
          gridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        >
          <div className="relative">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                "auto.features.video_code_batches.components.videocodebatchestable.searchPlaceholder",
              )}
              className="pl-10"
            />
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
          </div>

          {fixedCourseId == null ? (
            <SearchableSelect
              value={
                selectedCourseId !== ALL_FILTER_VALUE ? selectedCourseId : null
              }
              onValueChange={(value) => {
                setSelectedCourseId(value ?? ALL_FILTER_VALUE);
                setPage(1);
              }}
              options={courseOptions}
              placeholder={t(
                "auto.features.video_code_batches.components.videocodebatchestable.allCourses",
              )}
              searchPlaceholder={t(
                "auto.features.video_code_batches.components.videocodebatchestable.searchCourses",
              )}
              emptyMessage={t(
                "auto.features.video_code_batches.components.videocodebatchestable.noCoursesFound",
              )}
              allowClear
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {t(
                "auto.features.video_code_batches.components.videocodebatchestable.courseFilterLocked",
              )}
            </div>
          )}

          <SearchableSelect
            value={
              selectedVideoId !== ALL_FILTER_VALUE ? selectedVideoId : null
            }
            onValueChange={(value) => {
              setSelectedVideoId(value ?? ALL_FILTER_VALUE);
              setPage(1);
            }}
            options={videoOptions}
            placeholder={t(
              "auto.features.video_code_batches.components.videocodebatchestable.allVideos",
            )}
            searchPlaceholder={t(
              "auto.features.video_code_batches.components.videocodebatchestable.searchVideos",
            )}
            emptyMessage={
              effectiveCourseId
                ? t(
                    "auto.features.video_code_batches.components.videocodebatchestable.noVideosForCourse",
                  )
                : t(
                    "auto.features.video_code_batches.components.videocodebatchestable.noVideosFound",
                  )
            }
            allowClear
          />

          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full bg-white dark:bg-gray-900">
              <SelectValue
                placeholder={t(
                  "auto.features.video_code_batches.components.videocodebatchestable.allStatuses",
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchestable.allStatuses",
                )}
              </SelectItem>
              <SelectItem value="open">
                {t(
                  "auto.features.video_code_batches.components.videocodebatchestable.statusOpen",
                )}
              </SelectItem>
              <SelectItem value="closed">
                {t(
                  "auto.features.video_code_batches.components.videocodebatchestable.statusClosed",
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </ListingFilters>

        {isError ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchestable.failedToLoad",
                )}
              </AlertTitle>
              <AlertDescription>
                {batchesQuery.error instanceof Error
                  ? batchesQuery.error.message
                  : t("common.messages.loadFailed")}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[1220px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px] min-w-[160px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.columns.batch",
                      )}
                    </TableHead>
                    <TableHead className="w-[240px] min-w-[240px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.columns.video",
                      )}
                    </TableHead>
                    <TableHead className="w-[240px] min-w-[240px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.columns.course",
                      )}
                    </TableHead>
                    <TableHead className="w-[110px] min-w-[110px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.columns.status",
                      )}
                    </TableHead>
                    <TableHead className="w-[170px] min-w-[170px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.columns.codes",
                      )}
                    </TableHead>
                    <TableHead className="w-[100px] min-w-[100px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.viewLimit",
                      )}
                    </TableHead>
                    <TableHead className="w-[190px] min-w-[190px]">
                      {t(
                        "auto.features.video_code_batches.components.videocodebatchestable.columns.generated",
                      )}
                    </TableHead>
                    <TableHead
                      className={cn(
                        "w-24 min-w-[96px] font-medium",
                        isRtl ? "text-left" : "text-right",
                      )}
                    >
                      {t("common.labels.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10">
                        <EmptyState
                          title={t(
                            "auto.features.video_code_batches.components.videocodebatchestable.noBatchesTitle",
                          )}
                          description={t(
                            "auto.features.video_code_batches.components.videocodebatchestable.noBatchesDescription",
                          )}
                          action={
                            <Button onClick={() => setIsCreateOpen(true)}>
                              {t(
                                "auto.features.video_code_batches.components.videocodebatchestable.createBatch",
                              )}
                            </Button>
                          }
                          className="border-0 bg-transparent"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((batch) => {
                      const status = resolveStatusMeta(
                        batch.status_label ?? batch.status,
                        t,
                      );
                      const redeemedCount = Number(batch.redeemed_count ?? 0);
                      const quantity = Number(batch.quantity ?? 0);
                      const availableCodes =
                        batch.available_codes ??
                        Math.max(quantity - redeemedCount, 0);
                      const soldLimit = batch.sold_limit;
                      const canExpand =
                        batch.can_expand ??
                        normalizeStatus(batch.status) === "open";
                      const canClose =
                        batch.can_close ??
                        normalizeStatus(batch.status) === "open";

                      return (
                        <TableRow
                          key={batch.id}
                          className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                        >
                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/centers/${centerId}/code-batches/${batch.id}`}
                                  className="text-sm font-semibold text-gray-900 hover:text-primary dark:text-white"
                                >
                                  {resolveBatchTitle(batch, t)}
                                </Link>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[11px]"
                                >
                                  #{batch.id}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                                {batch.video_title ??
                                  t(
                                    "auto.features.video_code_batches.components.videocodebatchestable.unknownVideo",
                                  )}
                              </p>
                              <Badge
                                variant="secondary"
                                className="font-normal"
                              >
                                {t(
                                  "auto.features.video_code_batches.components.videocodebatchestable.videoWithId",
                                  { id: batch.video_id ?? "—" },
                                )}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                                {batch.course_title ??
                                  t(
                                    "auto.features.video_code_batches.components.videocodebatchestable.unknownCourse",
                                  )}
                              </p>
                              <Badge
                                variant="secondary"
                                className="font-normal"
                              >
                                {t(
                                  "auto.features.video_code_batches.components.videocodebatchestable.courseWithId",
                                  { id: batch.course_id ?? "—" },
                                )}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top text-sm text-gray-600 dark:text-gray-300">
                            <div>
                              {t(
                                "auto.features.video_code_batches.components.videocodebatchestable.total",
                              )}{" "}
                              {quantity}
                            </div>
                            <div>
                              {t(
                                "auto.features.video_code_batches.components.videocodebatchestable.redeemed",
                              )}{" "}
                              {redeemedCount}
                            </div>
                            <div>
                              {t(
                                "auto.features.video_code_batches.components.videocodebatchestable.available",
                              )}{" "}
                              {availableCodes}
                            </div>
                            <div>
                              {t(
                                "auto.features.video_code_batches.components.videocodebatchestable.sold",
                              )}{" "}
                              {soldLimit ??
                                t(
                                  "auto.features.video_code_batches.components.videocodebatchestable.notClosed",
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            {batch.view_limit_per_code ?? "—"}
                          </TableCell>
                          <TableCell className="align-top text-sm text-gray-600 dark:text-gray-300">
                            <div>
                              {batch.generated_at
                                ? formatDateTime(String(batch.generated_at))
                                : "—"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {batch.generated_by?.name ??
                                t(
                                  "auto.features.video_code_batches.components.videocodebatchestable.unknownAdmin",
                                )}
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-24 min-w-[96px] align-middle",
                              isRtl ? "text-left" : "text-right",
                            )}
                          >
                            <div className="flex items-center justify-end">
                              <Dropdown
                                isOpen={openMenuId === batch.id}
                                setIsOpen={(value) =>
                                  setOpenMenuId(value ? batch.id : null)
                                }
                              >
                                <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                                  ⋮
                                </DropdownTrigger>
                                <DropdownContent
                                  align="end"
                                  className="w-52 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                  <Link
                                    href={`/centers/${centerId}/code-batches/${batch.id}`}
                                    className={cn(
                                      "block rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800",
                                      isRtl ? "text-right" : "text-left",
                                    )}
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    {t(
                                      "auto.features.video_code_batches.components.videocodebatchestable.viewDetails",
                                    )}
                                  </Link>
                                  <button
                                    type="button"
                                    className={cn(
                                      "block w-full rounded px-3 py-2 hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800",
                                      isRtl ? "text-right" : "text-left",
                                    )}
                                    onClick={() =>
                                      void handleExport(batch, "csv")
                                    }
                                    disabled={
                                      activeDownloadKey === `${batch.id}-csv`
                                    }
                                  >
                                    {activeDownloadKey === `${batch.id}-csv`
                                      ? t(
                                          "auto.features.video_code_batches.components.videocodebatchestable.exportingCsv",
                                        )
                                      : t(
                                          "auto.features.video_code_batches.components.videocodebatchestable.exportCsv",
                                        )}
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      "block w-full rounded px-3 py-2 hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800",
                                      isRtl ? "text-right" : "text-left",
                                    )}
                                    onClick={() =>
                                      void handleExport(batch, "pdf")
                                    }
                                    disabled={
                                      activeDownloadKey === `${batch.id}-pdf`
                                    }
                                  >
                                    {activeDownloadKey === `${batch.id}-pdf`
                                      ? t(
                                          "auto.features.video_code_batches.components.videocodebatchestable.exportingPdf",
                                        )
                                      : t(
                                          "auto.features.video_code_batches.components.videocodebatchestable.exportPdf",
                                        )}
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(
                                      "block w-full rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800",
                                      isRtl ? "text-right" : "text-left",
                                    )}
                                    onClick={() => {
                                      setWhatsappBatch(batch);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    {t(
                                      "auto.features.video_code_batches.components.videocodebatchestable.sendCsvWhatsapp",
                                    )}
                                  </button>
                                  {canExpand ? (
                                    <button
                                      type="button"
                                      className={cn(
                                        "block w-full rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800",
                                        isRtl ? "text-right" : "text-left",
                                      )}
                                      onClick={() => {
                                        setExpandBatch(batch);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      {t(
                                        "auto.features.video_code_batches.components.videocodebatchestable.expandBatch",
                                      )}
                                    </button>
                                  ) : null}
                                  {canClose ? (
                                    <button
                                      type="button"
                                      className={cn(
                                        "block w-full rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800",
                                        isRtl ? "text-right" : "text-left",
                                      )}
                                      onClick={() => {
                                        setCloseBatch(batch);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      {normalizeStatus(batch.status) ===
                                      "closed"
                                        ? t(
                                            "auto.features.video_code_batches.components.videocodebatchestable.updateSoldLimit",
                                          )
                                        : t(
                                            "auto.features.video_code_batches.components.videocodebatchestable.closeBatch",
                                          )}
                                    </button>
                                  ) : null}
                                </DropdownContent>
                              </Dropdown>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {items.length > 0 ? (
              <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
                <PaginationControls
                  page={page}
                  lastPage={lastPage}
                  isFetching={isFetching}
                  onPageChange={setPage}
                  perPage={perPage}
                  onPerPageChange={(value) => {
                    setPerPage(value);
                    setPage(1);
                  }}
                />
              </div>
            ) : null}
          </>
        )}
      </ListingCard>

      <CreateVideoCodeBatchDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        centerId={centerId}
        coursePreset={
          fixedCourseId != null
            ? {
                id: fixedCourseId,
                label:
                  courseOptions.find(
                    (option) => option.value === String(fixedCourseId),
                  )?.label ??
                  t(
                    "auto.features.video_code_batches.components.videocodebatchestable.courseWithId",
                    { id: fixedCourseId },
                  ),
              }
            : null
        }
        onCreated={(batch) => {
          showToast(
            t(
              "auto.features.video_code_batches.components.videocodebatchestable.batchCreatedSuccess",
              {
                batch: resolveBatchTitle(batch, t),
              },
            ),
            "success",
          );
        }}
        onCompleted={() => batchesQuery.refetch().then(() => undefined)}
      />

      <ExpandVideoCodeBatchDialog
        open={Boolean(expandBatch)}
        onOpenChange={(open) => {
          if (!open) setExpandBatch(null);
        }}
        centerId={centerId}
        batch={expandBatch}
        onCompleted={() => batchesQuery.refetch().then(() => undefined)}
      />

      <CloseVideoCodeBatchDialog
        open={Boolean(closeBatch)}
        onOpenChange={(open) => {
          if (!open) setCloseBatch(null);
        }}
        centerId={centerId}
        batch={closeBatch}
        onCompleted={() => batchesQuery.refetch().then(() => undefined)}
      />

      <SendVideoCodeBatchWhatsappCsvDialog
        open={Boolean(whatsappBatch)}
        onOpenChange={(open) => {
          if (!open) setWhatsappBatch(null);
        }}
        centerId={centerId}
        batch={whatsappBatch}
        onSent={(record) => {
          showToast(
            normalizeStatus(record.status) === "sent"
              ? t(
                  "auto.features.video_code_batches.components.videocodebatchestable.whatsappSentSuccess",
                )
              : t(
                  "auto.features.video_code_batches.components.videocodebatchestable.whatsappSendStarted",
                ),
            "success",
          );
        }}
        onCompleted={() => batchesQuery.refetch().then(() => undefined)}
      />
    </div>
  );
}
