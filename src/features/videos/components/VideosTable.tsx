"use client";

import { useMemo, useState } from "react";
import { useVideos } from "@/features/videos/hooks/use-videos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as Icons from "@/components/Layouts/sidebar/icons";

const DEFAULT_PER_PAGE = 10;
const BADGE_BASE =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

function formatBadgeLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBadgeClass(value: string) {
  const normalized = value.toLowerCase();
  if (["active", "enabled", "approved"].includes(normalized)) {
    return `${BADGE_BASE} bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200`;
  }
  if (["pending", "processing"].includes(normalized)) {
    return `${BADGE_BASE} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200`;
  }
  if (["inactive", "disabled"].includes(normalized)) {
    return `${BADGE_BASE} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200`;
  }
  if (["failed", "rejected", "error"].includes(normalized)) {
    return `${BADGE_BASE} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200`;
  }
  return `${BADGE_BASE} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`;
}

export function VideosTable() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [page, perPage, query],
  );

  const { data, isLoading, isError, isFetching } = useVideos(params);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const nextDisabled = page * perPage >= total;
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Videos
          </h1>
          <p className="text-sm text-dark-5 dark:text-dark-4">
            Admin list of videos.
          </p>
        </div>

        <div className="flex w-full max-w-md items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos"
            aria-label="Search videos"
          />
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              setQuery(search.trim());
            }}
            disabled={isFetching}
          >
            Search
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-dark-5 dark:border-gray-700 dark:bg-gray-800 dark:text-dark-4">
          Failed to load data. Please try again later.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                ID
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Title
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Status
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingState
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-3 py-2">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              : showEmptyState
                ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <Icons.Table className="h-8 w-8 text-dark-4" />
                        <p className="text-sm font-medium text-dark dark:text-white">
                          No videos found
                        </p>
                        <p className="text-sm text-dark-5 dark:text-dark-4">
                          There are no videos matching the current criteria.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
                : items.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="px-3 py-2 text-sm font-medium text-dark dark:text-white">
                      {video.id}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate px-3 py-2 text-sm">
                      {video.title ?? "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {video.status ? (
                        <span className={getBadgeClass(video.status)}>
                          {formatBadgeLabel(video.status)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {video.duration ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-dark-5 dark:text-dark-4">
          Page {meta?.page ?? page} of {maxPage}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || isFetching}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
            disabled={nextDisabled || isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
