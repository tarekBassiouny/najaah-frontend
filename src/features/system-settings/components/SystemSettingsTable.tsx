"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/features/system-settings/hooks/use-system-settings";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";

const DEFAULT_PER_PAGE = 10;
const ALL_VISIBILITY = "all";
const CANONICAL_DEFAULT_KEYS = new Set([
  "timezone",
  "support_email",
  "require_device_approval",
  "attendance_required",
]);

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

function getRelativeTime(
  dateString: string | null | undefined,
  locale: string,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return t("pages.settings.table.relative.justNow");
  if (diffMins < 60) {
    return t("pages.settings.table.relative.minutesAgo", { count: diffMins });
  }
  if (diffHours < 24) {
    return t("pages.settings.table.relative.hoursAgo", { count: diffHours });
  }
  if (diffDays < 7) {
    return t("pages.settings.table.relative.daysAgo", { count: diffDays });
  }

  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function formatFullDate(
  dateString: string | null | undefined,
  locale: string,
): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale, {
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

function RegistryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "muted";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/30"
      : tone === "muted"
        ? "border-gray-200/80 bg-gray-50/90 dark:border-gray-800 dark:bg-gray-900/70"
        : "border-blue-200/80 bg-blue-50/80 dark:border-blue-900/70 dark:bg-blue-950/30";

  return (
    <div
      className={cn("rounded-2xl border px-4 py-3 shadow-sm", toneClassName)}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function formatHumanValue(
  setting: SystemSetting,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): string {
  const payload = setting.value;
  const payloadRecord =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;

  if (!payloadRecord) {
    return formatValuePreview(payload);
  }

  if (setting.key === "timezone") {
    return typeof payloadRecord.timezone === "string"
      ? payloadRecord.timezone
      : "—";
  }

  if (setting.key === "support_email") {
    return typeof payloadRecord.email === "string" ? payloadRecord.email : "—";
  }

  if (
    setting.key === "require_device_approval" ||
    setting.key === "attendance_required"
  ) {
    return payloadRecord.enabled === true
      ? t("pages.settings.table.values.enabled")
      : t("pages.settings.table.values.disabled");
  }

  const firstValue = Object.values(payloadRecord)[0];
  if (typeof firstValue === "string") return firstValue;
  if (typeof firstValue === "boolean")
    return firstValue
      ? t("pages.settings.table.values.enabled")
      : t("pages.settings.table.values.disabled");
  if (typeof firstValue === "number") return String(firstValue);

  return valueTypeLabel(getValueType(payload), t);
}

function valueTypeLabel(
  type: ValueType,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): string {
  switch (type) {
    case "object":
      return t("pages.settings.table.valueTypes.object");
    case "array":
      return t("pages.settings.table.valueTypes.array");
    case "null":
      return t("pages.settings.table.valueTypes.null");
    case "boolean":
      return t("pages.settings.table.valueTypes.boolean");
    case "number":
      return t("pages.settings.table.valueTypes.number");
    case "string":
    default:
      return t("pages.settings.table.valueTypes.string");
  }
}

type SystemSettingsTableProps = {
  onCreateSetting?: () => void;
  onEditSetting?: (_setting: SystemSetting) => void;
  onDeleteSetting?: (_setting: SystemSetting) => void;
};

export function SystemSettingsTable({
  onCreateSetting,
  onEditSetting,
  onDeleteSetting,
}: SystemSettingsTableProps) {
  const { t, locale } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<string>(ALL_VISIBILITY);

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
  const hasActiveFilters =
    search.trim().length > 0 || visibilityFilter !== ALL_VISIBILITY;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (visibilityFilter !== ALL_VISIBILITY ? 1 : 0);
  const publicCount = useMemo(
    () => items.filter((setting) => setting.is_public).length,
    [items],
  );
  const privateCount = useMemo(
    () => items.filter((setting) => !setting.is_public).length,
    [items],
  );

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <ListingCard className="overflow-hidden border-gray-200/80 shadow-sm dark:border-gray-800">
      <div className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#fff7ed_100%)] p-4 dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_48%,rgba(41,37,36,0.92)_100%)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
              {t("pages.settings.table.badge")}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">
                {t("pages.settings.table.title")}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {t("pages.settings.table.description")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <RegistryStat
                label={t("pages.settings.table.stats.visible")}
                value={`${items.length}`}
              />
              <RegistryStat
                label={t("pages.settings.table.stats.public")}
                value={`${publicCount}`}
                tone="success"
              />
              <RegistryStat
                label={t("pages.settings.table.stats.private")}
                value={`${privateCount}`}
                tone="muted"
              />
            </div>
            {onCreateSetting ? (
              <Button
                type="button"
                onClick={onCreateSetting}
                className="h-auto rounded-2xl px-5 py-3"
              >
                {t("pages.settings.table.actions.addKey")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

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
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {total === 1
                ? t("pages.settings.table.summary", { count: total })
                : t("pages.settings.table.summaryPlural", { count: total })}
            </span>
            {query ? (
              <span className="rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                {t("pages.settings.table.matching", { query })}
              </span>
            ) : null}
          </div>
        }
        className="border-b-0 bg-white/90 px-4 pb-3 pt-4 dark:bg-gray-950/70"
        gridClassName="grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_260px]"
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
            placeholder={t("pages.settings.table.searchPlaceholder")}
            className="h-11 rounded-xl border-gray-200 bg-white pl-10 pr-9 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
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
            aria-label={t("pages.settings.table.clearSearch")}
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
          <SelectTrigger className="h-11 w-full rounded-xl border-gray-200 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900">
            <SelectValue
              placeholder={t("pages.settings.table.filters.visibility")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VISIBILITY}>
              {t("pages.settings.table.filters.visibilityAll")}
            </SelectItem>
            <SelectItem value="public">
              {t("pages.settings.table.filters.public")}
            </SelectItem>
            <SelectItem value="private">
              {t("pages.settings.table.filters.private")}
            </SelectItem>
          </SelectContent>
        </Select>
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5 text-center shadow-sm dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {t("pages.settings.table.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              {t("pages.settings.table.retry")}
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
          <div className="grid gap-4 p-4 lg:hidden">
            {isLoadingState
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))
              : null}

            {!isLoadingState && showEmptyState ? (
              <EmptyState
                title={
                  query
                    ? t("pages.settings.table.empty.noResultsTitle")
                    : t("pages.settings.table.empty.noDataTitle")
                }
                description={
                  query
                    ? t("pages.settings.table.empty.noResultsDescription")
                    : t("pages.settings.table.empty.noDataDescription")
                }
                className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/50"
              />
            ) : null}

            {!isLoadingState
              ? items.map((setting) => {
                  const valueType = getValueType(setting.value);
                  const effectiveUpdatedAt =
                    setting.updated_at ?? setting.created_at ?? null;
                  const isCanonicalDefault = CANONICAL_DEFAULT_KEYS.has(
                    String(setting.key),
                  );

                  return (
                    <div
                      key={setting.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-semibold text-gray-950 dark:text-white">
                              {setting.key}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                VALUE_TYPE_STYLES[valueType],
                              )}
                            >
                              {t(
                                `pages.settings.table.valueTypeBadges.${valueType}`,
                              )}
                            </span>
                            <Badge variant="outline">
                              {t("pages.settings.table.labels.globalDefault")}
                            </Badge>
                            {isCanonicalDefault ? (
                              <Badge variant="secondary">
                                {t("pages.settings.table.labels.managedAbove")}
                              </Badge>
                            ) : null}
                            <Badge
                              variant={
                                setting.is_public ? "success" : "secondary"
                              }
                            >
                              {setting.is_public
                                ? t("pages.settings.table.filters.public")
                                : t("pages.settings.table.filters.private")}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-950/60">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          {t("pages.settings.table.headers.currentDefault")}
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {formatHumanValue(setting, t) || "—"}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {t("pages.settings.table.labels.lastUpdated")}
                        </span>
                        <span
                          title={
                            formatFullDate(effectiveUpdatedAt, locale) ||
                            undefined
                          }
                        >
                          {getRelativeTime(effectiveUpdatedAt, locale, t)}
                        </span>
                      </div>
                      {!isCanonicalDefault &&
                      (onEditSetting || onDeleteSetting) ? (
                        <div className="mt-4 flex gap-2">
                          {onEditSetting ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onEditSetting(setting)}
                            >
                              {t("pages.settings.table.actions.edit")}
                            </Button>
                          ) : null}
                          {onDeleteSetting ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => onDeleteSetting(setting)}
                            >
                              {t("pages.settings.table.actions.delete")}
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </div>

          <Table className="hidden min-w-[880px] lg:table">
            <TableHeader>
              <TableRow className="bg-gray-50/90 dark:bg-gray-900/80">
                <TableHead className="font-medium">
                  {t("pages.settings.table.headers.registryKey")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.settings.table.headers.currentDefault")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.settings.table.headers.visibility")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.settings.table.headers.lastSync")}
                </TableHead>
                {onEditSetting || onDeleteSetting ? (
                  <TableHead className="text-right font-medium">
                    {t("pages.settings.table.headers.actions")}
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
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
                      {onEditSetting || onDeleteSetting ? (
                        <TableCell>
                          <Skeleton className="ml-auto h-9 w-28 rounded-xl" />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell
                    colSpan={onEditSetting || onDeleteSetting ? 5 : 4}
                    className="h-48"
                  >
                    <EmptyState
                      title={
                        query
                          ? t("pages.settings.table.empty.noResultsTitle")
                          : t("pages.settings.table.empty.noDataTitle")
                      }
                      description={
                        query
                          ? t("pages.settings.table.empty.noResultsDescription")
                          : t("pages.settings.table.empty.noDataDescription")
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((setting) => {
                  const valueType = getValueType(setting.value);
                  const effectiveUpdatedAt =
                    setting.updated_at ?? setting.created_at ?? null;
                  const relativeUpdatedAt = getRelativeTime(
                    effectiveUpdatedAt,
                    locale,
                    t,
                  );
                  const fullUpdatedAt = formatFullDate(
                    effectiveUpdatedAt,
                    locale,
                  );
                  const isCanonicalDefault = CANONICAL_DEFAULT_KEYS.has(
                    String(setting.key),
                  );

                  return (
                    <TableRow
                      key={setting.id}
                      className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-900/50"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          <span className="font-mono text-sm">
                            {setting.key}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t("pages.settings.table.labels.globalDefaultHelp")}
                          </p>
                          {isCanonicalDefault ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {t(
                                "pages.settings.table.labels.managedFromDefaults",
                              )}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[460px]">
                        <div className="space-y-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              VALUE_TYPE_STYLES[valueType],
                            )}
                          >
                            {t(
                              `pages.settings.table.valueTypeBadges.${valueType}`,
                            )}
                          </span>
                          <div className="rounded-xl border border-gray-200 bg-gray-50/90 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/60">
                            <p
                              className="truncate text-sm font-medium text-gray-800 dark:text-gray-100"
                              title={formatHumanValue(setting, t)}
                            >
                              {formatHumanValue(setting, t) || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={setting.is_public ? "success" : "secondary"}
                        >
                          {setting.is_public
                            ? t("pages.settings.table.filters.public")
                            : t("pages.settings.table.filters.private")}
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
                      {onEditSetting || onDeleteSetting ? (
                        <TableCell>
                          {isCanonicalDefault ? (
                            <div className="flex justify-end">
                              <Badge variant="secondary">
                                {t("pages.settings.table.labels.managedAbove")}
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {onEditSetting ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEditSetting(setting)}
                                >
                                  {t("pages.settings.table.actions.edit")}
                                </Button>
                              ) : null}
                              {onDeleteSetting ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => onDeleteSetting(setting)}
                                >
                                  {t("pages.settings.table.actions.delete")}
                                </Button>
                              ) : null}
                            </div>
                          )}
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
