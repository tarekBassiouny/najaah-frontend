"use client";

import { useEffect, useMemo, useState } from "react";
import { usePdfs } from "@/features/pdfs/hooks/use-pdfs";
import { getPdfSignedUrl } from "@/features/pdfs/services/pdfs.service";
import { BulkDeletePdfsDialog } from "@/features/pdfs/components/BulkDeletePdfsDialog";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/components/ui/modal-store";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 10;

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

const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "secondary" | "error" | "default";
    label: string;
  }
> = {
  active: { variant: "success", label: "Active" },
  enabled: { variant: "success", label: "Enabled" },
  approved: { variant: "success", label: "Approved" },
  pending: { variant: "warning", label: "Pending" },
  processing: { variant: "warning", label: "Processing" },
  inactive: { variant: "default", label: "Inactive" },
  disabled: { variant: "default", label: "Disabled" },
  failed: { variant: "error", label: "Failed" },
  rejected: { variant: "error", label: "Rejected" },
  error: { variant: "error", label: "Error" },
};

function getStatusConfig(status: PdfStatus) {
  if (typeof status === "number") {
    if (status === 0) return { variant: "warning" as const, label: "Pending" };
    if (status === 1)
      return { variant: "warning" as const, label: "Uploading" };
    if (status === 2) return { variant: "success" as const, label: "Ready" };
    if (status === 3) return { variant: "error" as const, label: "Failed" };
    return { variant: "default" as const, label: String(status) };
  }

  const normalized = status.toLowerCase();
  return (
    statusConfig[normalized] || {
      variant: "default" as const,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    }
  );
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
  const { showToast } = useModal();
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedPdfs, setSelectedPdfs] = useState<Record<string, Pdf>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const params = useMemo(
    () => ({
      centerId: centerId ?? undefined,
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [centerId, page, perPage, query],
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
  const hasActiveFilters = search.trim().length > 0;
  const activeFilterCount = search.trim().length > 0 ? 1 : 0;

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
  }, [centerId, page, perPage, query]);

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
          setPage(1);
        }}
        summary={
          centerId ? (
            <>
              {total} {total === 1 ? "PDF" : "PDFs"}
            </>
          ) : (
            <>Select a center to view PDFs.</>
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
            placeholder="Search PDFs..."
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
          Select a center to view PDFs.
        </div>
      ) : isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load PDFs. Please try again.
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
                      aria-label="Select all PDFs on this page"
                    />
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Size</TableHead>
                <TableHead className="font-medium">Uploaded By</TableHead>
                <TableHead className="font-medium">Created</TableHead>
                <TableHead className="font-medium">Used In</TableHead>
                <TableHead className="w-10 text-right font-medium">
                  Actions
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
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
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
                    colSpan={enableBulkSelection ? 8 : 7}
                    className="h-48"
                  >
                    <EmptyState
                      title={query ? "No PDFs found" : "No PDFs yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Upload PDFs to get started"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((pdf, index) => {
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;

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
                            aria-label={`Select ${pdf.title ?? `pdf ${pdf.id}`}`}
                            disabled={isBulkDeleteDialogOpen}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {pdf.title ?? "—"}
                      </TableCell>
                      <TableCell>
                        {pdf.status != null || pdf.upload_status != null ? (
                          <Badge
                            variant={
                              getStatusConfig(
                                pdf.upload_status ?? pdf.status ?? "",
                              ).variant
                            }
                          >
                            {
                              getStatusConfig(
                                pdf.upload_status ?? pdf.status ?? "",
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
                        {pdf.creator?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDate(pdf.created_at)}
                      </TableCell>
                      <TableCell>
                        {typeof pdf.courses_count === "number" ? (
                          <Badge variant="secondary">
                            {pdf.courses_count}{" "}
                            {pdf.courses_count === 1 ? "course" : "courses"}
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
                                          "Failed to get preview URL",
                                          "error",
                                        );
                                      }
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Preview
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
                                          "Failed to get download URL",
                                          "error",
                                        );
                                      }
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Download
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
                                  View details
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
                                  Edit PDF
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
                                  Delete PDF
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
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isLoadingState}
            >
              Delete Selected
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
