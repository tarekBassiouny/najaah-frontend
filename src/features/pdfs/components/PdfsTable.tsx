"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePdfs } from "@/features/pdfs/hooks/use-pdfs";
import { useTenant } from "@/app/tenant-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PER_PAGE = 10;

type PdfStatus = "active" | "processing" | "failed" | string;

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
};

export function PdfsTable({ centerId: centerIdProp }: PdfsTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

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

  if (!centerId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a center to view PDFs.
          </p>
        </CardContent>
      </Card>
    );
  }

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1);
      setQuery(search.trim());
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
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
              onKeyDown={handleKeyDown}
              placeholder="Search PDFs..."
              className="pl-10"
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {total} {total === 1 ? "PDF" : "PDFs"}
          </div>
        </div>

        {isError ? (
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-medium">ID</TableHead>
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">File Size</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="ml-auto h-8 w-16" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : showEmptyState ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48">
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
                  items.map((pdf) => (
                    <TableRow key={pdf.id} className="group">
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {pdf.id}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {pdf.title ?? "—"}
                      </TableCell>
                      <TableCell>
                        {pdf.status ? (
                          <Badge variant={getStatusConfig(pdf.status).variant}>
                            {getStatusConfig(pdf.status).label}
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Link href={`/centers/${centerId}/pdfs/${pdf.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link
                            href={`/centers/${centerId}/pdfs/${pdf.id}/edit`}
                          >
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!isError && maxPage > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {maxPage}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
                disabled={page >= maxPage || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
