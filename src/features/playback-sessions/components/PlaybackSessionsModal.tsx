"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingFilters } from "@/components/ui/listing-filters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date-time";
import { usePlaybackSessions } from "@/features/playback-sessions/hooks/use-playback-sessions";
import { useTranslation } from "@/features/localization";

const DEFAULT_FILTERS = {
  search: "",
  startedFrom: "",
  startedTo: "",
  isFullPlay: undefined as boolean | undefined,
  isLocked: undefined as boolean | undefined,
  autoClosed: undefined as boolean | undefined,
  isActive: undefined as boolean | undefined,
  orderBy: "started_at" as const,
  orderDirection: "desc" as const,
};

type PlaybackSessionsModalProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string | number;
  courseId: number | string;
  courseTitle?: string | null;
  videoId: number | string;
  videoTitle?: string | null;
  userId?: number | string;
};

type LocalFilters = typeof DEFAULT_FILTERS;

const BOOLEAN_FILTERS: Array<{
  stateKey: keyof Pick<
    LocalFilters,
    "isFullPlay" | "isLocked" | "autoClosed" | "isActive"
  >;
  label: string;
}> = [
  { stateKey: "isFullPlay", label: "Full play only" },
  { stateKey: "isLocked", label: "Locked sessions" },
  { stateKey: "autoClosed", label: "Auto-closed" },
  { stateKey: "isActive", label: "Active" },
];

const SORT_FIELDS = [
  { value: "started_at", label: "Started at" },
  { value: "updated_at", label: "Updated at" },
  { value: "progress_percent", label: "Progress %" },
  { value: "watch_duration", label: "Watch duration" },
] as const;

const SORT_DIRECTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

const FilterSearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4", className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || seconds < 0) return "—";
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function PlaybackSessionsModal({
  open,
  onOpenChange,
  centerId,
  courseId,
  courseTitle,
  videoId,
  videoTitle,
  userId,
}: PlaybackSessionsModalProps) {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<LocalFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    if (!open) return;
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, [open, courseId, videoId]);

  const queryParams = useMemo(
    () => ({
      search: filters.search.trim() || undefined,
      started_from: filters.startedFrom || undefined,
      started_to: filters.startedTo || undefined,
      is_full_play: filters.isFullPlay,
      is_locked: filters.isLocked,
      auto_closed: filters.autoClosed,
      is_active: filters.isActive,
      order_by: filters.orderBy,
      order_direction: filters.orderDirection,
      page,
      per_page: perPage,
      course_id: courseId,
      video_id: videoId,
      user_id: userId,
    }),
    [filters, page, perPage, courseId, videoId, userId],
  );

  const query = usePlaybackSessions(centerId, queryParams, open);
  const sessions = query.data?.items ?? [];
  const total = query.data?.meta?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const activeBooleanFilters = BOOLEAN_FILTERS.reduce(
    (count, filter) => (filters[filter.stateKey] ? count + 1 : count),
    0,
  );
  const searchFilterActive = Boolean(filters.search.trim());
  const activeFilterCount =
    (searchFilterActive ? 1 : 0) +
    (filters.startedFrom ? 1 : 0) +
    (filters.startedTo ? 1 : 0) +
    activeBooleanFilters;
  const hasActiveFilters = activeFilterCount > 0;
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const toggleBooleanFilter = (key: keyof LocalFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] ? undefined : true,
    }));
    setPage(1);
  };

  const handleSortByChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      orderBy: value as LocalFilters["orderBy"],
    }));
    setPage(1);
  };

  const handleSortDirectionChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      orderDirection: value as LocalFilters["orderDirection"],
    }));
    setPage(1);
  };

  const refresh = () => {
    query.refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle>
                {t(
                  "auto.features.playback_sessions.components.playbacksessionsmodal.s1",
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {videoTitle ? `${videoTitle}` : "Video"} ·{" "}
                {courseTitle ?? "Course"}
              </DialogDescription>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">
                  {total.toLocaleString()} session{total === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline">
                  Page {page} · {perPage} rows
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={query.isFetching}
              >
                Refresh
              </Button>
            </div>
          </div>
          <ListingFilters
            activeCount={activeFilterCount}
            isFetching={query.isFetching}
            isLoading={query.isLoading}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
            summary={
              <span className="text-xs text-gray-500">
                Showing {total.toLocaleString()} sessions
              </span>
            }
            className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80 dark:shadow-none"
            gridClassName="grid-cols-1 gap-3 lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FilterSearchIcon />
                </span>
                <Input
                  value={filters.search}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }));
                    setPage(1);
                  }}
                  placeholder={t(
                    "auto.features.playback_sessions.components.playbacksessionsmodal.s2",
                  )}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                    !searchFilterActive && "pointer-events-none opacity-0",
                  )}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, search: "" }));
                    setPage(1);
                  }}
                  aria-label={t(
                    "auto.features.playback_sessions.components.playbacksessionsmodal.s3",
                  )}
                >
                  <svg
                    className="h-3.5 w-3.5"
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
            </div>
            <div>
              <Select
                value={filters.orderBy}
                onValueChange={handleSortByChange}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_FIELDS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:col-span-2">
              <div>
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  From
                </span>
                <input
                  title={t(
                    "auto.features.playback_sessions.components.playbacksessionsmodal.s4",
                  )}
                  type="date"
                  value={filters.startedFrom}
                  max={filters.startedTo || undefined}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      startedFrom: event.target.value,
                    }));
                    setPage(1);
                  }}
                  className={cn(
                    "mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900",
                    !filters.startedFrom && "text-gray-500",
                  )}
                />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  To
                </span>
                <input
                  title={t(
                    "auto.features.playback_sessions.components.playbacksessionsmodal.s5",
                  )}
                  type="date"
                  value={filters.startedTo}
                  min={filters.startedFrom || undefined}
                  onChange={(event) => {
                    setFilters((prev) => ({
                      ...prev,
                      startedTo: event.target.value,
                    }));
                    setPage(1);
                  }}
                  className={cn(
                    "mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900",
                    !filters.startedTo && "text-gray-500",
                  )}
                />
              </div>
            </div>
            <div>
              <Select
                value={filters.orderDirection}
                onValueChange={handleSortDirectionChange}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_DIRECTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </ListingFilters>
          <div className="flex flex-wrap items-center gap-2">
            {BOOLEAN_FILTERS.map((filter) => {
              const active = Boolean(filters[filter.stateKey]);
              return (
                <Badge
                  key={filter.stateKey}
                  variant={active ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleBooleanFilter(filter.stateKey)}
                >
                  {filter.label}
                </Badge>
              );
            })}
          </div>
        </DialogHeader>

        <div className="mt-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-900/40">
              {t(
                "auto.features.playback_sessions.components.playbacksessionsmodal.s6",
              )}
              {total.toLocaleString()})
            </div>
            <div className="min-h-[200px]">
              {query.isLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((id) => (
                    <Skeleton key={id} className="h-12 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex items-center justify-center px-4 py-10 text-sm text-gray-500">
                  {t(
                    "auto.features.playback_sessions.components.playbacksessionsmodal.s7",
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>
                        {t(
                          "auto.features.playback_sessions.components.playbacksessionsmodal.s8",
                        )}
                      </TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>
                        {t(
                          "auto.features.playback_sessions.components.playbacksessionsmodal.s9",
                        )}
                      </TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Flags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <Avatar
                              size={36}
                              src={session.user?.avatar_url ?? null}
                              name={
                                session.user?.name ??
                                session.user?.email ??
                                session.user?.phone ??
                                "Student"
                              }
                            />
                            <div className="min-w-0 truncate">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {session.user?.name ??
                                  session.user?.email ??
                                  session.user?.phone ??
                                  "Student"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {session.user?.email ??
                                  session.user?.phone ??
                                  "—"}
                              </p>
                              {(session.course?.title ||
                                session.video?.title) && (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {session.course?.title ? (
                                    <Badge
                                      variant="outline"
                                      title={session.course.title}
                                      className="max-w-[200px] truncate text-[11px]"
                                    >
                                      {session.course.title}
                                    </Badge>
                                  ) : null}
                                  {session.video?.title ? (
                                    <Badge
                                      variant="secondary"
                                      title={session.video.title}
                                      className="max-w-[200px] truncate text-[11px]"
                                    >
                                      {session.video.title}
                                    </Badge>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {session.device?.device_name ??
                              session.device?.device_id ??
                              "Device"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.device?.device_type ?? "—"}
                          </p>
                          {session.device?.status_label ||
                          session.device?.status_key ? (
                            <Badge variant="secondary" className="mt-1">
                              {session.device?.status_label ??
                                session.device?.status_key}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(session.started_at ?? null)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(session.last_activity_at ?? null)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(session.watch_duration)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {session.progress_percent != null
                              ? `${Math.round(session.progress_percent)}%`
                              : "—"}
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{
                                width: `${
                                  session.progress_percent
                                    ? Math.min(
                                        100,
                                        Math.max(0, session.progress_percent),
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {session.is_full_play && (
                              <Badge variant="success">
                                {t(
                                  "auto.features.playback_sessions.components.playbacksessionsmodal.s10",
                                )}
                              </Badge>
                            )}
                            {session.is_locked && (
                              <Badge variant="warning">Locked</Badge>
                            )}
                            {session.auto_closed && (
                              <Badge variant="secondary">Auto-closed</Badge>
                            )}
                            {session.is_active && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          {session.close_reason ? (
                            <p className="text-xs text-gray-500">
                              {t(
                                "auto.features.playback_sessions.components.playbacksessionsmodal.s11",
                              )}
                              {session.close_reason}
                            </p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3">
          <PaginationControls
            page={page}
            lastPage={lastPage}
            perPage={perPage}
            onPageChange={(next) => setPage(next)}
            onPerPageChange={(nextPerPage) => {
              setPerPage(nextPerPage);
              setPage(1);
            }}
            isFetching={query.isFetching}
            perPageOptions={[10, 20, 50, 100]}
          />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t(
              "auto.features.playback_sessions.components.playbacksessionsmodal.s12",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
