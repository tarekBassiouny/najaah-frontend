"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { useModal } from "@/components/ui/modal-store";
import { useSystemSettings } from "@/features/system-settings/hooks/use-system-settings";
import { deleteSystemSetting } from "@/features/system-settings/services/system-settings.service";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";
import {
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

const DEFAULT_PER_PAGE = 10;
const ALL_VISIBILITY = "all";

type SystemSettingsTableProps = {
  onEdit: (_setting: SystemSetting) => void;
  onDelete: (_setting: SystemSetting) => void;
};

type ValueType = "string" | "number" | "boolean" | "object" | "array" | "null";

function getValueType(value: unknown): ValueType {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

function formatValuePreview(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getRelativeTime(dateString?: string | null): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateString?: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VALUE_TYPE_STYLES: Record<ValueType, string> = {
  string: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  number: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  boolean:
    "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  object:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  array: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400",
  null: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function SystemSettingsTable({
  onEdit,
  onDelete,
}: SystemSettingsTableProps) {
  const queryClient = useQueryClient();
  const { showToast } = useModal();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<string>(ALL_VISIBILITY);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<
    Record<string, SystemSetting>
  >({});
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      is_public:
        visibilityFilter === ALL_VISIBILITY
          ? undefined
          : visibilityFilter === "public",
    }),
    [page, perPage, query, visibilityFilter],
  );

  const { data, isLoading, isError, isFetching } = useSystemSettings(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const selectedIds = useMemo(
    () => Object.keys(selectedSettings),
    [selectedSettings],
  );
  const selectedCount = selectedIds.length;
  const selectedSettingsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedSettings[id])
        .filter((setting): setting is SystemSetting => Boolean(setting)),
    [selectedIds, selectedSettings],
  );
  const pageSettingIds = useMemo(
    () => items.map((setting) => String(setting.id)),
    [items],
  );
  const isAllPageSelected =
    pageSettingIds.length > 0 &&
    pageSettingIds.every((id) => Boolean(selectedSettings[id]));
  const enableBulkSelection = true;
  const hasActiveFilters =
    search.trim().length > 0 || visibilityFilter !== ALL_VISIBILITY;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (visibilityFilter !== ALL_VISIBILITY ? 1 : 0);

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setSelectedSettings({});
  }, [page, perPage, query, visibilityFilter]);

  const toggleSettingSelection = (setting: SystemSetting) => {
    const id = String(setting.id);
    setSelectedSettings((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = setting;
      }
      return next;
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedSettings((prev) => {
        const next = { ...prev };
        pageSettingIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedSettings((prev) => {
      const next = { ...prev };
      items.forEach((setting) => {
        next[String(setting.id)] = setting;
      });
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedSettingsList.length === 0 || isBulkDeleting) return;

    const confirmed = window.confirm(
      `Delete ${selectedSettingsList.length} selected setting${
        selectedSettingsList.length === 1 ? "" : "s"
      }?`,
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);

    let deletedCount = 0;
    let lastSuccessMessage = "";
    for (const setting of selectedSettingsList) {
      try {
        const response = await deleteSystemSetting(setting.id);
        if (!isAdminRequestSuccessful(response)) {
          continue;
        }
        deletedCount += 1;
        lastSuccessMessage = getAdminResponseMessage(response, lastSuccessMessage);
      } catch {
        // Continue deleting remaining selections even if one fails.
      }
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["system-settings"] }),
      queryClient.invalidateQueries({ queryKey: ["system-settings-preview"] }),
    ]);
    setSelectedSettings({});
    setIsBulkDeleting(false);

    if (deletedCount === selectedSettingsList.length) {
      showToast(
        lastSuccessMessage ||
          `Deleted ${deletedCount} setting${deletedCount === 1 ? "" : "s"} successfully.`,
        "success",
      );
      return;
    }

    showToast(
      `Deleted ${deletedCount} of ${selectedSettingsList.length} selected settings.`,
      "error",
    );
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
          setVisibilityFilter(ALL_VISIBILITY);
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "setting" : "settings"}
          </>
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
            placeholder="Search by key"
            className="pl-10 pr-9 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
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

        <Select
          value={visibilityFilter}
          onValueChange={(value) => {
            setPage(1);
            setVisibilityFilter(value);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VISIBILITY}>Visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load settings. Please try again.
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
          <Table className="min-w-[900px]">
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
                      aria-label="Select all settings on this page"
                    />
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">Key</TableHead>
                <TableHead className="font-medium">Value</TableHead>
                <TableHead className="font-medium">Visibility</TableHead>
                <TableHead className="font-medium">Updated At</TableHead>
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
                        <Skeleton className="h-4 w-64" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell
                    colSpan={enableBulkSelection ? 6 : 5}
                    className="h-48"
                  >
                    <EmptyState
                      title={query ? "No settings found" : "No settings yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Create your first system setting to get started"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((setting, index) => {
                  const valuePreview = formatValuePreview(setting.value);
                  const valueType = getValueType(setting.value);
                  const valueInline = valuePreview.replace(/\s+/g, " ").trim();
                  const displayValue =
                    valueInline.length > 120
                      ? `${valueInline.slice(0, 120)}...`
                      : valueInline;
                  const effectiveUpdatedAt =
                    setting.updated_at ?? setting.created_at ?? null;
                  const relativeUpdatedAt = getRelativeTime(effectiveUpdatedAt);
                  const fullUpdatedAt = formatFullDate(effectiveUpdatedAt);
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;

                  return (
                    <TableRow
                      key={setting.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      {enableBulkSelection ? (
                        <TableCell>
                          <input
                            type="checkbox"
                            className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                            checked={Boolean(
                              selectedSettings[String(setting.id)],
                            )}
                            onChange={() => toggleSettingSelection(setting)}
                            aria-label={`Select setting ${setting.key}`}
                            disabled={isBulkDeleting}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <span className="font-mono">{setting.key}</span>
                      </TableCell>
                      <TableCell className="max-w-[420px]">
                        <div className="space-y-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              VALUE_TYPE_STYLES[valueType],
                            )}
                          >
                            {valueType}
                          </span>
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-gray-800/60">
                            <span
                              className="block truncate font-mono text-xs text-gray-600 dark:text-gray-300"
                              title={valuePreview}
                            >
                              {displayValue || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={setting.is_public ? "success" : "secondary"}
                        >
                          {setting.is_public ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="space-y-0.5"
                          title={fullUpdatedAt || undefined}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {relativeUpdatedAt}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fullUpdatedAt || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === setting.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? setting.id : null)
                            }
                          >
                            <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                              ⋮
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className={cn(
                                "w-44 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                shouldOpenUp && "bottom-full mb-2 mt-0",
                              )}
                            >
                              <button
                                className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEdit(setting);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDelete(setting);
                                }}
                              >
                                Delete
                              </button>
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
              disabled={isLoadingState || isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting..." : "Delete Selected"}
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
    </ListingCard>
  );
}
