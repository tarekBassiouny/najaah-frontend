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

function resolveStatusMeta(status: unknown) {
  const normalized = normalizeStatus(status);
  if (normalized === "open") {
    return {
      label: "Open",
      variant: "success" as const,
    };
  }

  if (normalized === "closed") {
    return {
      label: "Closed",
      variant: "default" as const,
    };
  }

  return {
    label: typeof status === "string" && status.trim() ? status : "Unknown",
    variant: "secondary" as const,
  };
}

function resolveBatchTitle(batch: VideoCodeBatch) {
  return batch.batch_code ?? `Batch ${batch.id}`;
}

export function VideoCodeBatchesTable({
  centerId,
  fixedCourseId = null,
  hideHeader = false,
}: VideoCodeBatchesTableProps) {
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
      label: course.title ?? course.name ?? `Course ${course.id}`,
    }));
  }, [coursesQuery.data?.items]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    return (videosQuery.data?.items ?? []).map((video) => ({
      value: String(video.id),
      label:
        video.title ??
        video.title_translations?.en ??
        video.title_translations?.ar ??
        `Video ${video.id}`,
    }));
  }, [videosQuery.data?.items]);

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
      showToast(`${format.toUpperCase()} exported successfully.`, "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : `Failed to export ${format.toUpperCase()}.`,
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
              Video Code Batches
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage anonymous access code batches for video code courses.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Create Batch</Button>
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
          summary={`${total} batch${total === 1 ? "" : "es"}`}
          gridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        >
          <div className="relative">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search batches..."
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
              placeholder="All courses"
              searchPlaceholder="Search courses..."
              emptyMessage="No video code courses found"
              allowClear
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              Course filter locked to this course
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
            placeholder="All videos"
            searchPlaceholder="Search videos..."
            emptyMessage={
              effectiveCourseId
                ? "No videos found for this course"
                : "No videos found"
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
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </ListingFilters>

        {isError ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Failed to load batches</AlertTitle>
              <AlertDescription>
                {batchesQuery.error instanceof Error
                  ? batchesQuery.error.message
                  : "Please try again."}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Codes</TableHead>
                    <TableHead>View Limit</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 6 }).map((__, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10">
                        <EmptyState
                          title="No batches found"
                          description="Create the first batch for a video code course to start managing exports and redemptions."
                          action={
                            <Button onClick={() => setIsCreateOpen(true)}>
                              Create Batch
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
                        <TableRow key={batch.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <Link
                                href={`/centers/${centerId}/code-batches/${batch.id}`}
                                className="text-sm font-semibold text-gray-900 hover:text-primary dark:text-white"
                              >
                                {resolveBatchTitle(batch)}
                              </Link>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <div>
                                  {batch.video_title ?? "Unknown video"}
                                </div>
                                <div>
                                  {batch.course_title ?? "Unknown course"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                            <div>Total: {quantity}</div>
                            <div>Redeemed: {redeemedCount}</div>
                            <div>Available: {availableCodes}</div>
                            <div>Sold: {soldLimit ?? "Not closed"}</div>
                          </TableCell>
                          <TableCell>
                            {batch.view_limit_per_code ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                            <div>
                              {batch.generated_at
                                ? formatDateTime(String(batch.generated_at))
                                : "—"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {batch.generated_by?.name ?? "Unknown admin"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <Dropdown
                                isOpen={openMenuId === batch.id}
                                setIsOpen={(value) =>
                                  setOpenMenuId(value ? batch.id : null)
                                }
                              >
                                <DropdownTrigger className="px-2 text-lg text-gray-400 hover:text-gray-600">
                                  ⋮
                                </DropdownTrigger>
                                <DropdownContent
                                  align="end"
                                  className="w-52 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                >
                                  <Link
                                    href={`/centers/${centerId}/code-batches/${batch.id}`}
                                    className="block rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    View details
                                  </Link>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
                                    onClick={() =>
                                      void handleExport(batch, "csv")
                                    }
                                    disabled={
                                      activeDownloadKey === `${batch.id}-csv`
                                    }
                                  >
                                    {activeDownloadKey === `${batch.id}-csv`
                                      ? "Exporting CSV..."
                                      : "Export CSV"}
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
                                    onClick={() =>
                                      void handleExport(batch, "pdf")
                                    }
                                    disabled={
                                      activeDownloadKey === `${batch.id}-pdf`
                                    }
                                  >
                                    {activeDownloadKey === `${batch.id}-pdf`
                                      ? "Exporting PDF..."
                                      : "Export PDF"}
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setWhatsappBatch(batch);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Send CSV to WhatsApp
                                  </button>
                                  {canExpand ? (
                                    <button
                                      type="button"
                                      className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setExpandBatch(batch);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      Expand batch
                                    </button>
                                  ) : null}
                                  {canClose ? (
                                    <button
                                      type="button"
                                      className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                      onClick={() => {
                                        setCloseBatch(batch);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      {normalizeStatus(batch.status) ===
                                      "closed"
                                        ? "Update sold limit"
                                        : "Close batch"}
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
                  )?.label ?? `Course ${fixedCourseId}`,
              }
            : null
        }
        onCreated={(batch) => {
          showToast(
            `Batch ${resolveBatchTitle(batch)} created successfully.`,
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
              ? "WhatsApp CSV sent successfully."
              : "WhatsApp CSV send started.",
            "success",
          );
        }}
        onCompleted={() => batchesQuery.refetch().then(() => undefined)}
      />
    </div>
  );
}
