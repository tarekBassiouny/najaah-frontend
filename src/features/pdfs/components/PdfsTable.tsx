"use client";

import { useEffect, useMemo, useState } from "react";
import { usePdfs } from "@/features/pdfs/hooks/use-pdfs";
import { getPdfSignedUrl } from "@/features/pdfs/services/pdfs.service";
import { BulkDeletePdfsDialog } from "@/features/pdfs/components/BulkDeletePdfsDialog";
import { useTenant } from "@/app/tenant-provider";
import type { Pdf } from "@/features/pdfs/types/pdf";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/components/ui/modal-store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_SOURCE_TYPE_VALUE = "all";
const ALL_SOURCE_PROVIDER_VALUE = "all";

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

type PdfStatus = "active" | "processing" | "failed" | string | number;
type TranslateFunction = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "secondary" | "error" | "default";
    labelKey: string;
  }
> = {
  active: { variant: "success", labelKey: "active" },
  enabled: { variant: "success", labelKey: "active" },
  approved: { variant: "success", labelKey: "active" },
  pending: { variant: "warning", labelKey: "pending" },
  processing: { variant: "warning", labelKey: "processing" },
  uploading: { variant: "warning", labelKey: "uploading" },
  ready: { variant: "success", labelKey: "ready" },
  inactive: { variant: "default", labelKey: "inactive" },
  disabled: { variant: "default", labelKey: "inactive" },
  failed: { variant: "error", labelKey: "failed" },
  rejected: { variant: "error", labelKey: "failed" },
  error: { variant: "error", labelKey: "failed" },
};

function getStatusConfig(status: PdfStatus, t: TranslateFunction) {
  if (typeof status === "number") {
    if (status === 0)
      return {
        variant: "warning" as const,
        label: t("pages.pdfs.table.status.pending"),
      };
    if (status === 1)
      return {
        variant: "warning" as const,
        label: t("pages.pdfs.table.status.uploading"),
      };
    if (status === 2)
      return {
        variant: "success" as const,
        label: t("pages.pdfs.table.status.ready"),
      };
    if (status === 3)
      return {
        variant: "error" as const,
        label: t("pages.pdfs.table.status.failed"),
      };
    return { variant: "default" as const, label: String(status) };
  }

  const normalized = status.toLowerCase();
  const config = statusConfig[normalized];
  if (config) {
    return {
      variant: config.variant,
      label: t(`pages.pdfs.table.status.${config.labelKey}`),
    };
  }

  return {
    variant: "default" as const,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  };
}

function resolvePdfSourceTypeLabel(pdf: Pdf, t: TranslateFunction) {
  const rawType = String(pdf.source_type ?? "")
    .trim()
    .toLowerCase();

  if (rawType === "1" || rawType === "upload") {
    return t("pages.pdfs.table.sourceMode.upload");
  }

  if (rawType === "0" || rawType === "url") {
    return t("pages.pdfs.table.sourceMode.url");
  }

  return pdf.source_url
    ? t("pages.pdfs.table.sourceMode.url")
    : t("pages.pdfs.table.sourceMode.upload");
}

function resolvePdfProviderLabel(pdf: Pdf, t: TranslateFunction) {
  const rawProvider = String(pdf.source_provider ?? "")
    .trim()
    .toLowerCase();

  if (rawProvider === "spaces") {
    return t("pages.pdfs.table.filters.najaahApp");
  }

  if (rawProvider === "custom") {
    return t("pages.pdfs.table.filters.custom");
  }

  if (rawProvider) {
    return rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1);
  }

  return resolvePdfSourceTypeLabel(pdf, t) ===
    t("pages.pdfs.table.sourceMode.upload")
    ? t("pages.pdfs.table.filters.najaahApp")
    : t("pages.pdfs.table.filters.custom");
}

function resolvePdfTags(pdf: Pdf) {
  if (!Array.isArray(pdf.tags)) return [];
  return pdf.tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

type PdfsTableProps = {
  centerId?: string | number;
  onView?: (_pdf: Pdf) => void;
  onEdit?: (_pdf: Pdf) => void;
  onDelete?: (_pdf: Pdf) => void;
};

export function PdfsTable({
  centerId: centerIdProp,
  onView,
  onEdit,
  onDelete,
}: PdfsTableProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>(
    ALL_SOURCE_TYPE_VALUE,
  );
  const [sourceProviderFilter, setSourceProviderFilter] = useState<string>(
    ALL_SOURCE_PROVIDER_VALUE,
  );
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedPdfs, setSelectedPdfs] = useState<Record<string, Pdf>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const params = useMemo(
    () => ({
      centerId: centerId ?? undefined,
      page,
      per_page: perPage,
      q: query || undefined,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
      source_type:
        sourceTypeFilter === ALL_SOURCE_TYPE_VALUE
          ? undefined
          : sourceTypeFilter,
      source_provider:
        sourceProviderFilter === ALL_SOURCE_PROVIDER_VALUE
          ? undefined
          : sourceProviderFilter,
      created_from: createdFrom || undefined,
      created_to: createdTo || undefined,
    }),
    [
      centerId,
      page,
      perPage,
      query,
      statusFilter,
      sourceTypeFilter,
      sourceProviderFilter,
      createdFrom,
      createdTo,
    ],
  );

  const { data, isLoading, isError, isFetching } = usePdfs(params);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const enableBulkSelection = Boolean(centerId);
  const selectedIds = useMemo(() => Object.keys(selectedPdfs), [selectedPdfs]);
  const selectedCount = selectedIds.length;
  const selectedPdfsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedPdfs[id])
        .filter((pdf): pdf is Pdf => Boolean(pdf)),
    [selectedIds, selectedPdfs],
  );
  const pagePdfIds = useMemo(() => items.map((pdf) => String(pdf.id)), [items]);
  const isAllPageSelected =
    pagePdfIds.length > 0 &&
    pagePdfIds.every((id) => Boolean(selectedPdfs[id]));
  const showEmptyState =
    !isLoadingState && !isError && items.length === 0 && Boolean(centerId);
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== ALL_STATUS_VALUE ||
    sourceTypeFilter !== ALL_SOURCE_TYPE_VALUE ||
    sourceProviderFilter !== ALL_SOURCE_PROVIDER_VALUE ||
    createdFrom.trim().length > 0 ||
    createdTo.trim().length > 0;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (sourceTypeFilter !== ALL_SOURCE_TYPE_VALUE ? 1 : 0) +
    (sourceProviderFilter !== ALL_SOURCE_PROVIDER_VALUE ? 1 : 0) +
    (createdFrom.trim().length > 0 ? 1 : 0) +
    (createdTo.trim().length > 0 ? 1 : 0);

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setSelectedPdfs({});
  }, [
    centerId,
    page,
    perPage,
    query,
    statusFilter,
    sourceTypeFilter,
    sourceProviderFilter,
    createdFrom,
    createdTo,
  ]);

  const togglePdfSelection = (pdf: Pdf) => {
    const id = String(pdf.id);
    setSelectedPdfs((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = pdf;
      }
      return next;
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedPdfs((prev) => {
        const next = { ...prev };
        pagePdfIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedPdfs((prev) => {
      const next = { ...prev };
      items.forEach((pdf) => {
        next[String(pdf.id)] = pdf;
      });
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedPdfsList.length === 0 || centerId == null) {
      return;
    }
    setIsBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteSuccess = (message: string) => {
    showToast(message, "success");
    setSelectedPdfs({});
  };

  return (
    <ListingCard>
      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearch("");
          setQuery("");
          setStatusFilter(ALL_STATUS_VALUE);
          setSourceTypeFilter(ALL_SOURCE_TYPE_VALUE);
          setSourceProviderFilter(ALL_SOURCE_PROVIDER_VALUE);
          setCreatedFrom("");
          setCreatedTo("");
          setPage(1);
        }}
        summary={
          centerId ? (
            <>
              {total === 1
                ? t("pages.pdfs.table.summary", { count: total })
                : t("pages.pdfs.table.summaryPlural", { count: total })}
            </>
          ) : (
            <>{t("pages.pdfs.table.selectCenter")}</>
          )
        }
        gridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
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
            placeholder={t("pages.pdfs.table.searchPlaceholder")}
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
            aria-label={t("pages.pdfs.table.clearSearch")}
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
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          disabled={!centerId}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder={t("pages.pdfs.table.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              {t("pages.pdfs.table.filters.allStatuses")}
            </SelectItem>
            <SelectItem value="pending">
              {t("pages.pdfs.table.filters.pending")}
            </SelectItem>
            <SelectItem value="uploading">
              {t("pages.pdfs.table.filters.uploading")}
            </SelectItem>
            <SelectItem value="ready">
              {t("pages.pdfs.table.filters.ready")}
            </SelectItem>
            <SelectItem value="failed">
              {t("pages.pdfs.table.filters.failed")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sourceTypeFilter}
          onValueChange={(value) => {
            setSourceTypeFilter(value);
            setPage(1);
          }}
          disabled={!centerId}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={t("pages.pdfs.table.filters.sourceType")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SOURCE_TYPE_VALUE}>
              {t("pages.pdfs.table.filters.allSourceTypes")}
            </SelectItem>
            <SelectItem value="upload">
              {t("pages.pdfs.table.filters.upload")}
            </SelectItem>
            <SelectItem value="url">
              {t("pages.pdfs.table.filters.url")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sourceProviderFilter}
          onValueChange={(value) => {
            setSourceProviderFilter(value);
            setPage(1);
          }}
          disabled={!centerId}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder={t("pages.pdfs.table.filters.provider")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SOURCE_PROVIDER_VALUE}>
              {t("pages.pdfs.table.filters.allProviders")}
            </SelectItem>
            <SelectItem value="spaces">
              {t("pages.pdfs.table.filters.najaahApp")}
            </SelectItem>
            <SelectItem value="custom">
              {t("pages.pdfs.table.filters.custom")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={createdFrom}
          max={createdTo || undefined}
          onChange={(event) => {
            setCreatedFrom(event.target.value);
            setPage(1);
          }}
          title={t("pages.pdfs.table.filters.createdFrom")}
          disabled={!centerId}
        />

        <Input
          type="date"
          value={createdTo}
          min={createdFrom || undefined}
          onChange={(event) => {
            setCreatedTo(event.target.value);
            setPage(1);
          }}
          title={t("pages.pdfs.table.filters.createdTo")}
          disabled={!centerId}
        />
      </ListingFilters>

      {!centerId ? (
        <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("pages.pdfs.table.selectCenter")}
        </div>
      ) : isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.pdfs.table.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              {t("pages.pdfs.table.retry")}
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
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                {enableBulkSelection ? (
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                      checked={isAllPageSelected}
                      onChange={toggleAllSelections}
                      disabled={isLoadingState || items.length === 0}
                      aria-label={t("pages.pdfs.table.selectAll")}
                    />
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.pdf")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.tags")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.provider")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.status")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.size")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.created")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.pdfs.table.headers.usedIn")}
                </TableHead>
                <TableHead className="w-10 text-right font-medium">
                  {t("pages.pdfs.table.headers.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      {enableBulkSelection ? (
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-12" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell
                    colSpan={enableBulkSelection ? 9 : 8}
                    className="h-48"
                  >
                    <EmptyState
                      title={
                        query
                          ? t("pages.pdfs.table.empty.noResultsTitle")
                          : t("pages.pdfs.table.empty.noDataTitle")
                      }
                      description={
                        query
                          ? t("pages.pdfs.table.empty.noResultsDescription")
                          : t("pages.pdfs.table.empty.noDataDescription")
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((pdf, index) => {
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;
                  const sourceTypeLabel = resolvePdfSourceTypeLabel(pdf, t);
                  const providerLabel = resolvePdfProviderLabel(pdf, t);
                  const tags = resolvePdfTags(pdf);

                  return (
                    <TableRow
                      key={pdf.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      {enableBulkSelection ? (
                        <TableCell>
                          <input
                            type="checkbox"
                            className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                            checked={Boolean(selectedPdfs[String(pdf.id)])}
                            onChange={() => togglePdfSelection(pdf)}
                            aria-label={t("pages.pdfs.table.selectPdf", {
                              name: pdf.title ?? `pdf ${pdf.id}`,
                            })}
                            disabled={isBulkDeleteDialogOpen}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {pdf.title ?? "—"}
                          </p>
                          <p
                            className="line-clamp-2 max-w-sm text-xs text-gray-500 dark:text-gray-400"
                            title={
                              pdf.description ??
                              pdf.description_translations?.en ??
                              pdf.description_translations?.ar ??
                              undefined
                            }
                          >
                            {pdf.description ??
                              pdf.description_translations?.en ??
                              pdf.description_translations?.ar ??
                              t("pages.pdfs.table.description.noDescription")}
                          </p>
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
                            {sourceTypeLabel}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pdf.status != null || pdf.upload_status != null ? (
                          <Badge
                            variant={
                              getStatusConfig(
                                pdf.upload_status ?? pdf.status ?? "",
                                t,
                              ).variant
                            }
                          >
                            {
                              getStatusConfig(
                                pdf.upload_status ?? pdf.status ?? "",
                                t,
                              ).label
                            }
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {typeof pdf.file_size_kb === "number"
                          ? `${pdf.file_size_kb} KB`
                          : pdf.file_size_kb
                            ? String(pdf.file_size_kb)
                            : typeof pdf.file_size === "number"
                              ? `${pdf.file_size} KB`
                              : pdf.file_size
                                ? String(pdf.file_size)
                                : "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDate(pdf.created_at)}
                      </TableCell>
                      <TableCell>
                        {typeof pdf.courses_count === "number" ? (
                          <Badge variant="secondary">
                            {pdf.courses_count}{" "}
                            {pdf.courses_count === 1
                              ? t("pages.pdfs.table.usage.course")
                              : t("pages.pdfs.table.usage.courses")}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === pdf.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? pdf.id : null)
                            }
                          >
                            <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                              ⋮
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className={cn(
                                "w-40 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                shouldOpenUp && "bottom-full mb-2 mt-0",
                              )}
                            >
                              {centerId && pdf.source_id ? (
                                <>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={async () => {
                                      try {
                                        const { url } = await getPdfSignedUrl(
                                          centerId,
                                          pdf.id,
                                          "inline",
                                        );
                                        window.open(url, "_blank");
                                      } catch {
                                        showToast(
                                          t(
                                            "pages.pdfs.table.actions.previewFailed",
                                          ),
                                          "error",
                                        );
                                      }
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    {t("pages.pdfs.table.actions.preview")}
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={async () => {
                                      try {
                                        const { url } = await getPdfSignedUrl(
                                          centerId,
                                          pdf.id,
                                          "attachment",
                                        );
                                        const link =
                                          document.createElement("a");
                                        link.href = url;
                                        link.download =
                                          pdf.title ?? "document.pdf";
                                        link.click();
                                      } catch {
                                        showToast(
                                          t(
                                            "pages.pdfs.table.actions.downloadFailed",
                                          ),
                                          "error",
                                        );
                                      }
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    {t("pages.pdfs.table.actions.download")}
                                  </button>
                                </>
                              ) : null}
                              {onView ? (
                                <button
                                  type="button"
                                  className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    onView(pdf);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  {t("pages.pdfs.table.actions.viewDetails")}
                                </button>
                              ) : null}
                              {onEdit ? (
                                <button
                                  type="button"
                                  className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    onEdit(pdf);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  {t("pages.pdfs.table.actions.editPdf")}
                                </button>
                              ) : null}
                              {onDelete ? (
                                <button
                                  type="button"
                                  className="block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                  onClick={() => {
                                    onDelete(pdf);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  {t("pages.pdfs.table.actions.delete")}
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
      )}

      {selectedCount > 0 && enableBulkSelection ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {t("pages.pdfs.table.bulk.selected", { count: selectedCount })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isLoadingState}
            >
              {t("pages.pdfs.table.bulk.deleteSelected")}
            </Button>
          </div>
        </div>
      ) : null}

      {!isError && maxPage > 1 && (
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
      )}

      {centerId ? (
        <BulkDeletePdfsDialog
          open={isBulkDeleteDialogOpen}
          onOpenChange={setIsBulkDeleteDialogOpen}
          pdfs={selectedPdfsList}
          centerId={centerId}
          onSuccess={handleBulkDeleteSuccess}
        />
      ) : null}
    </ListingCard>
  );
}
