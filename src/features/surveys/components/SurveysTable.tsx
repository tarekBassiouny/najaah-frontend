"use client";

import { useEffect, useMemo, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { useTranslation } from "@/features/localization";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { useSurveys } from "@/features/surveys/hooks/use-surveys";
import type { Survey, SurveyType } from "@/features/surveys/types/survey";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 20;
const ALL_ACTIVE_VALUE = "all";
const ALL_MANDATORY_VALUE = "all";
const ALL_TYPE_VALUE = "all";
const DATE_PRESET_NONE = "none";
const DATE_PRESET_ACTIVE_NOW = "active_now";
const DATE_PRESET_UPCOMING = "upcoming";
const DATE_PRESET_ENDED = "ended";
const DATE_PRESET_STARTS_THIS_MONTH = "starts_this_month";

type DatePreset =
  | typeof DATE_PRESET_NONE
  | typeof DATE_PRESET_ACTIVE_NOW
  | typeof DATE_PRESET_UPCOMING
  | typeof DATE_PRESET_ENDED
  | typeof DATE_PRESET_STARTS_THIS_MONTH;

type SurveysTableProps = {
  centerId?: string | number;
  onEdit?: (_survey: Survey) => void;
  onAssign?: (_survey: Survey) => void;
  onClose?: (_survey: Survey) => void;
  onChangeStatus?: (_survey: Survey) => void;
  onBulkChangeStatus?: (_surveys: Survey[]) => void;
  onBulkClose?: (_surveys: Survey[]) => void;
  onBulkDelete?: (_surveys: Survey[]) => void;
  onDelete?: (_survey: Survey) => void;
  onViewResults?: (_survey: Survey) => void;
};

function getSurveyTitle(survey: Survey) {
  if (survey.title_translations?.en) return survey.title_translations.en;
  if (survey.title_translations?.ar) return survey.title_translations.ar;
  if (survey.title) return String(survey.title);
  return `Survey #${survey.id}`;
}

function getScopeBadge(survey: Survey, t: (_key: string) => string) {
  const scopeType = Number(survey.scope_type);
  if (scopeType === 2) {
    return (
      <Badge variant="info">{t("pages.surveys.table.scope.center")}</Badge>
    );
  }
  return (
    <Badge variant="secondary">{t("pages.surveys.table.scope.system")}</Badge>
  );
}

function getCenterLabel(survey: Survey, t: (_key: string) => string) {
  if (survey.center?.name) return survey.center.name;
  if (survey.center_id != null)
    return `${t("pages.surveys.table.scope.center")} #${survey.center_id}`;
  return t("pages.surveys.table.fallbackCenter");
}

function getAssignmentLabel(
  survey: Survey,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const formatAssignment = (assignment?: Survey["assignment"]) => {
    if (!assignment) return null;
    const type = String(assignment.type ?? "").toLowerCase();

    if (type === "all") return t("pages.surveys.table.assignment.allStudents");

    const assignableName =
      typeof assignment.assignable_name === "string" &&
      assignment.assignable_name.trim()
        ? assignment.assignable_name.trim()
        : null;

    if (assignableName) return assignableName;

    const assignableId = assignment.assignable_id ?? assignment.id;
    if (assignableId == null) return null;

    const prefix =
      type === "course"
        ? t("pages.surveys.table.assignment.course")
        : type === "center"
          ? t("pages.surveys.table.assignment.center")
          : type === "video"
            ? t("pages.surveys.table.assignment.video")
            : type === "user"
              ? t("pages.surveys.table.assignment.student")
              : t("pages.surveys.table.assignment.assignment");

    return `${prefix} #${assignableId}`;
  };

  const assignments = Array.isArray(survey.assignments)
    ? survey.assignments
    : [];
  const firstAssignment = assignments[0];
  const assignmentLabel = formatAssignment(firstAssignment);
  if (assignmentLabel) {
    const extraCount = assignments.length - 1;
    if (extraCount > 0) {
      return `${assignmentLabel} ${t("pages.surveys.table.assignment.more", { count: extraCount })}`;
    }
    return assignmentLabel;
  }

  if (survey.show_to_all_students)
    return t("pages.surveys.table.assignment.allStudents");

  const singleAssignmentLabel = formatAssignment(survey.assignment);
  if (singleAssignmentLabel) return singleAssignmentLabel;

  return "—";
}

function getQuestionsCount(survey: Survey) {
  if (Array.isArray(survey.questions)) return survey.questions.length;
  return 0;
}

function getSubmittedUsersCount(survey: Survey) {
  const value = survey.submitted_users_count;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function getDateRange(survey: Survey) {
  const start = survey.start_at || "—";
  const end = survey.end_at || "—";
  return `${start} → ${end}`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SurveysTable({
  centerId: centerIdProp,
  onEdit,
  onAssign,
  onClose,
  onChangeStatus,
  onBulkChangeStatus,
  onBulkClose,
  onBulkDelete,
  onDelete,
  onViewResults,
}: SurveysTableProps) {
  const { t } = useTranslation();
  const tenant = useTenant();
  const scopeCenterId = useMemo(() => {
    if (centerIdProp == null) return undefined;
    const parsed = Number(centerIdProp);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [centerIdProp]);
  const selectedFilterCenterId = useMemo(() => {
    if (scopeCenterId != null || tenant.centerId == null) return undefined;
    const parsed = Number(tenant.centerId);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [scopeCenterId, tenant.centerId]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState(ALL_ACTIVE_VALUE);
  const [isMandatoryFilter, setIsMandatoryFilter] =
    useState(ALL_MANDATORY_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_TYPE_VALUE);
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [endFrom, setEndFrom] = useState("");
  const [endTo, setEndTo] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>(DATE_PRESET_NONE);
  const [isDateFiltersExpanded, setIsDateFiltersExpanded] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedSurveys, setSelectedSurveys] = useState<
    Record<string, Survey>
  >({});
  const isStartDateRangeInvalid = Boolean(
    startFrom && startTo && startFrom > startTo,
  );
  const isEndDateRangeInvalid = Boolean(endFrom && endTo && endFrom > endTo);
  const hasDateValidationError =
    isStartDateRangeInvalid || isEndDateRangeInvalid;

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: scopeCenterId == null ? selectedFilterCenterId : undefined,
      is_active:
        isActiveFilter === ALL_ACTIVE_VALUE
          ? undefined
          : isActiveFilter === "active",
      is_mandatory:
        isMandatoryFilter === ALL_MANDATORY_VALUE
          ? undefined
          : isMandatoryFilter === "mandatory",
      type:
        typeFilter === ALL_TYPE_VALUE
          ? undefined
          : (Number(typeFilter) as SurveyType),
      start_from: isStartDateRangeInvalid ? undefined : startFrom || undefined,
      start_to: isStartDateRangeInvalid ? undefined : startTo || undefined,
      end_from: isEndDateRangeInvalid ? undefined : endFrom || undefined,
      end_to: isEndDateRangeInvalid ? undefined : endTo || undefined,
    }),
    [
      page,
      perPage,
      query,
      scopeCenterId,
      selectedFilterCenterId,
      isActiveFilter,
      isMandatoryFilter,
      typeFilter,
      startFrom,
      startTo,
      endFrom,
      endTo,
      isStartDateRangeInvalid,
      isEndDateRangeInvalid,
    ],
  );

  const { data, isLoading, isError, isFetching } = useSurveys(params, {
    centerId: scopeCenterId ?? null,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const maxPage = Math.max(1, data?.lastPage ?? Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const selectedIds = useMemo(
    () => Object.keys(selectedSurveys),
    [selectedSurveys],
  );
  const selectedCount = selectedIds.length;
  const selectedSurveysList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedSurveys[id])
        .filter((survey): survey is Survey => Boolean(survey)),
    [selectedIds, selectedSurveys],
  );
  const pageSurveyIds = useMemo(
    () => items.map((survey) => String(survey.id)),
    [items],
  );
  const isAllPageSelected =
    pageSurveyIds.length > 0 &&
    pageSurveyIds.every((id) => Boolean(selectedSurveys[id]));
  const hasActions = Boolean(
    onEdit ||
    onAssign ||
    onClose ||
    onChangeStatus ||
    onDelete ||
    onViewResults,
  );
  const enableBulkSelection = Boolean(
    onBulkChangeStatus || onBulkClose || onBulkDelete,
  );
  const hasActiveFilters =
    Boolean(search.trim()) ||
    isActiveFilter !== ALL_ACTIVE_VALUE ||
    isMandatoryFilter !== ALL_MANDATORY_VALUE ||
    typeFilter !== ALL_TYPE_VALUE ||
    Boolean(startFrom) ||
    Boolean(startTo) ||
    Boolean(endFrom) ||
    Boolean(endTo);
  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (isActiveFilter !== ALL_ACTIVE_VALUE ? 1 : 0) +
    (isMandatoryFilter !== ALL_MANDATORY_VALUE ? 1 : 0) +
    (typeFilter !== ALL_TYPE_VALUE ? 1 : 0) +
    (startFrom ? 1 : 0) +
    (startTo ? 1 : 0) +
    (endFrom ? 1 : 0) +
    (endTo ? 1 : 0);

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
  }, [scopeCenterId, selectedFilterCenterId]);

  useEffect(() => {
    setSelectedSurveys({});
  }, [
    scopeCenterId,
    selectedFilterCenterId,
    page,
    perPage,
    query,
    isActiveFilter,
    isMandatoryFilter,
    typeFilter,
    startFrom,
    startTo,
    endFrom,
    endTo,
  ]);

  const toggleSurveySelection = (survey: Survey) => {
    const surveyId = String(survey.id);
    setSelectedSurveys((prev) => {
      if (prev[surveyId]) {
        const { [surveyId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [surveyId]: survey };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedSurveys((prev) => {
        if (pageSurveyIds.length === 0) return prev;
        const next = { ...prev };
        pageSurveyIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedSurveys((prev) => {
      const next = { ...prev };
      items.forEach((survey) => {
        next[String(survey.id)] = survey;
      });
      return next;
    });
  };

  const applyDatePreset = (preset: DatePreset) => {
    const today = new Date();
    const todayValue = toDateInputValue(today);

    if (preset === DATE_PRESET_ACTIVE_NOW) {
      setStartFrom("");
      setStartTo(todayValue);
      setEndFrom(todayValue);
      setEndTo("");
    } else if (preset === DATE_PRESET_UPCOMING) {
      setStartFrom(todayValue);
      setStartTo("");
      setEndFrom("");
      setEndTo("");
    } else if (preset === DATE_PRESET_ENDED) {
      setStartFrom("");
      setStartTo("");
      setEndFrom("");
      setEndTo(todayValue);
    } else if (preset === DATE_PRESET_STARTS_THIS_MONTH) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartFrom(toDateInputValue(monthStart));
      setStartTo(toDateInputValue(monthEnd));
      setEndFrom("");
      setEndTo("");
    } else {
      setStartFrom("");
      setStartTo("");
      setEndFrom("");
      setEndTo("");
    }

    setDatePreset(preset);
    setIsDateFiltersExpanded(false);
    setPage(1);
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
          setIsActiveFilter(ALL_ACTIVE_VALUE);
          setIsMandatoryFilter(ALL_MANDATORY_VALUE);
          setTypeFilter(ALL_TYPE_VALUE);
          setStartFrom("");
          setStartTo("");
          setEndFrom("");
          setEndTo("");
          setDatePreset(DATE_PRESET_NONE);
          setIsDateFiltersExpanded(false);
          setPage(1);
        }}
        summary={
          <>
            {total === 1
              ? t("pages.surveys.table.summary", { count: total })
              : t("pages.surveys.table.summaryPlural", { count: total })}
          </>
        }
        gridClassName="grid-cols-1 md:grid-cols-3"
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
            placeholder={t("pages.surveys.table.searchPlaceholder")}
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
            aria-label={t("pages.surveys.table.clearSearch")}
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

        {scopeCenterId == null ? (
          <CenterPicker
            className="w-full min-w-0"
            selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        ) : null}

        <Select
          value={isActiveFilter}
          onValueChange={(value) => {
            setPage(1);
            setIsActiveFilter(value);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={t("pages.surveys.table.filters.status")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ACTIVE_VALUE}>
              {t("pages.surveys.table.filters.status")}
            </SelectItem>
            <SelectItem value="active">
              {t("pages.surveys.table.filters.active")}
            </SelectItem>
            <SelectItem value="inactive">
              {t("pages.surveys.table.filters.inactive")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={isMandatoryFilter}
          onValueChange={(value) => {
            setPage(1);
            setIsMandatoryFilter(value);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={t("pages.surveys.table.filters.requirement")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MANDATORY_VALUE}>
              {t("pages.surveys.table.filters.requirement")}
            </SelectItem>
            <SelectItem value="mandatory">
              {t("pages.surveys.table.filters.mandatory")}
            </SelectItem>
            <SelectItem value="optional">
              {t("pages.surveys.table.filters.optional")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setPage(1);
            setTypeFilter(value);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder={t("pages.surveys.table.filters.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPE_VALUE}>
              {t("pages.surveys.table.filters.type")}
            </SelectItem>
            <SelectItem value="1">
              {t("pages.surveys.table.filters.feedback")}
            </SelectItem>
            <SelectItem value="2">
              {t("pages.surveys.table.filters.mandatoryType")}
            </SelectItem>
            <SelectItem value="3">
              {t("pages.surveys.table.filters.poll")}
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2 md:col-span-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("pages.surveys.table.dateFilters.quickLabel")}
          </span>
          <Button
            type="button"
            size="sm"
            variant={
              datePreset === DATE_PRESET_ACTIVE_NOW ? "default" : "outline"
            }
            className="h-8 px-3 text-xs"
            onClick={() => applyDatePreset(DATE_PRESET_ACTIVE_NOW)}
          >
            {t("pages.surveys.table.dateFilters.activeNow")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              datePreset === DATE_PRESET_UPCOMING ? "default" : "outline"
            }
            className="h-8 px-3 text-xs"
            onClick={() => applyDatePreset(DATE_PRESET_UPCOMING)}
          >
            {t("pages.surveys.table.dateFilters.upcoming")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={datePreset === DATE_PRESET_ENDED ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            onClick={() => applyDatePreset(DATE_PRESET_ENDED)}
          >
            {t("pages.surveys.table.dateFilters.ended")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              datePreset === DATE_PRESET_STARTS_THIS_MONTH
                ? "default"
                : "outline"
            }
            className="h-8 px-3 text-xs"
            onClick={() => applyDatePreset(DATE_PRESET_STARTS_THIS_MONTH)}
          >
            {t("pages.surveys.table.dateFilters.startsThisMonth")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs md:ml-auto"
            onClick={() => setIsDateFiltersExpanded((prev) => !prev)}
          >
            {isDateFiltersExpanded
              ? t("pages.surveys.table.dateFilters.hideAdvanced")
              : t("pages.surveys.table.dateFilters.showAdvanced")}
          </Button>
        </div>

        {isDateFiltersExpanded ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40 md:col-span-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t("pages.surveys.table.dateFilters.windowTitle")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.surveys.table.dateFilters.windowHint")}
                <code className="ml-1 rounded bg-gray-200 px-1 py-0.5 text-[11px] dark:bg-gray-800">
                  {t("auto.features.surveys.components.surveystable.s1")}
                </code>
                {t("common.labels.and")}
                <code className="ml-1 rounded bg-gray-200 px-1 py-0.5 text-[11px] dark:bg-gray-800">
                  {t("auto.features.surveys.components.surveystable.s2")}
                </code>
                .
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("pages.surveys.table.dateFilters.startDateRange")}
                </p>
                <label className="block text-xs text-gray-600 dark:text-gray-300">
                  {t("pages.surveys.table.dateFilters.startsOnOrAfter")}
                </label>
                <input
                  type="date"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
                  value={startFrom}
                  onChange={(event) => {
                    setDatePreset(DATE_PRESET_NONE);
                    setStartFrom(event.target.value);
                    setPage(1);
                  }}
                />
                <label className="block text-xs text-gray-600 dark:text-gray-300">
                  {t("pages.surveys.table.dateFilters.startsOnOrBefore")}
                </label>
                <input
                  type="date"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
                  min={startFrom || undefined}
                  value={startTo}
                  onChange={(event) => {
                    setDatePreset(DATE_PRESET_NONE);
                    setStartTo(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("pages.surveys.table.dateFilters.endDateRange")}
                </p>
                <label className="block text-xs text-gray-600 dark:text-gray-300">
                  {t("pages.surveys.table.dateFilters.endsOnOrAfter")}
                </label>
                <input
                  type="date"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
                  value={endFrom}
                  onChange={(event) => {
                    setDatePreset(DATE_PRESET_NONE);
                    setEndFrom(event.target.value);
                    setPage(1);
                  }}
                />
                <label className="block text-xs text-gray-600 dark:text-gray-300">
                  {t("pages.surveys.table.dateFilters.endsOnOrBefore")}
                </label>
                <input
                  type="date"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
                  min={endFrom || undefined}
                  value={endTo}
                  onChange={(event) => {
                    setDatePreset(DATE_PRESET_NONE);
                    setEndTo(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {hasDateValidationError ? (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                {isStartDateRangeInvalid
                  ? t("pages.surveys.table.dateFilters.startRangeInvalid")
                  : t("pages.surveys.table.dateFilters.endRangeInvalid")}
              </p>
            ) : null}
          </div>
        ) : null}
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.surveys.table.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              {t("pages.surveys.table.retry")}
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
          <Table className="min-w-[1160px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  {enableBulkSelection ? (
                    <input
                      type="checkbox"
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                      checked={isAllPageSelected}
                      onChange={toggleAllSelections}
                      disabled={isLoadingState || items.length === 0}
                      aria-label={t("pages.surveys.table.selectAll")}
                    />
                  ) : null}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.title")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.scope")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.center")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.status")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.assignment")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.window")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.questions")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.surveys.table.headers.submitted")}
                </TableHead>
                {hasActions ? (
                  <TableHead className="w-10 text-right font-medium">
                    {t("pages.surveys.table.headers.actions")}
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingState ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    {hasActions ? (
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasActions ? 10 : 9} className="h-48">
                    <EmptyState
                      title={
                        query
                          ? t("pages.surveys.table.empty.noResultsTitle")
                          : t("pages.surveys.table.empty.noDataTitle")
                      }
                      description={
                        query
                          ? t("pages.surveys.table.empty.noResultsDescription")
                          : t("pages.surveys.table.empty.noDataDescription")
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((survey, index) => {
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;

                  return (
                    <TableRow
                      key={survey.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        {enableBulkSelection ? (
                          <input
                            type="checkbox"
                            className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                            checked={Boolean(
                              selectedSurveys[String(survey.id)],
                            )}
                            onChange={() => toggleSurveySelection(survey)}
                            aria-label={`Select survey ${String(survey.id)}`}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {getSurveyTitle(survey)}
                      </TableCell>
                      <TableCell>{getScopeBadge(survey, t)}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getCenterLabel(survey, t)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={survey.is_active ? "success" : "default"}
                        >
                          {survey.is_active
                            ? t("pages.surveys.table.status.active")
                            : t("pages.surveys.table.status.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getAssignmentLabel(survey, t)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getDateRange(survey)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getQuestionsCount(survey)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getSubmittedUsersCount(survey)}
                      </TableCell>

                      {hasActions ? (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === survey.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? survey.id : null)
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
                                {onEdit ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit(survey);
                                    }}
                                  >
                                    {t("pages.surveys.table.actions.edit")}
                                  </button>
                                ) : null}

                                {onAssign ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onAssign(survey);
                                    }}
                                  >
                                    {t("pages.surveys.table.actions.assign")}
                                  </button>
                                ) : null}

                                {onChangeStatus ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onChangeStatus(survey);
                                    }}
                                  >
                                    {t(
                                      "pages.surveys.table.actions.changeStatus",
                                    )}
                                  </button>
                                ) : null}

                                {onClose && survey.is_active ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onClose(survey);
                                    }}
                                  >
                                    {t("pages.surveys.table.actions.close")}
                                  </button>
                                ) : null}

                                {onViewResults ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onViewResults(survey);
                                    }}
                                  >
                                    {t(
                                      "pages.surveys.table.actions.viewResults",
                                    )}
                                  </button>
                                ) : null}

                                {onDelete ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDelete(survey);
                                    }}
                                  >
                                    {t("pages.surveys.table.actions.delete")}
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

      {selectedCount > 0 && enableBulkSelection ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {t("pages.surveys.table.bulk.selected", { count: selectedCount })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBulkChangeStatus ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkChangeStatus(selectedSurveysList)}
                disabled={isLoadingState}
              >
                {t("pages.surveys.table.bulk.changeStatus")}
              </Button>
            ) : null}
            {onBulkClose ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkClose(selectedSurveysList)}
                disabled={isLoadingState}
              >
                {t("pages.surveys.table.bulk.closeSurveys")}
              </Button>
            ) : null}
            {onBulkDelete ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onBulkDelete(selectedSurveysList)}
                disabled={isLoadingState}
              >
                {t("pages.surveys.table.bulk.deleteSurveys")}
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
