"use client";

import { useEffect, useMemo, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
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

function getScopeBadge(survey: Survey) {
  const scopeType = Number(survey.scope_type);
  if (scopeType === 2) {
    return <Badge variant="info">Center</Badge>;
  }
  return <Badge variant="secondary">System</Badge>;
}

function getCenterLabel(survey: Survey) {
  if (survey.center?.name) return survey.center.name;
  if (survey.center_id != null) return `Center #${survey.center_id}`;
  return "Najaah App";
}

function getAssignmentLabel(survey: Survey) {
  const formatAssignment = (assignment?: Survey["assignment"]) => {
    if (!assignment) return null;
    const type = String(assignment.type ?? "").toLowerCase();

    if (type === "all") return "All Students";

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
        ? "Course"
        : type === "center"
          ? "Center"
          : type === "video"
            ? "Video"
            : type === "user"
              ? "Student"
              : "Assignment";

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
      return `${assignmentLabel} +${extraCount} more`;
    }
    return assignmentLabel;
  }

  if (survey.show_to_all_students) return "All Students";

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
            {total} {total === 1 ? "survey" : "surveys"}
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
            placeholder="Search surveys..."
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
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ACTIVE_VALUE}>Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
            <SelectValue placeholder="Requirement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MANDATORY_VALUE}>Requirement</SelectItem>
            <SelectItem value="mandatory">Mandatory</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
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
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPE_VALUE}>Type</SelectItem>
            <SelectItem value="1">Feedback</SelectItem>
            <SelectItem value="2">Mandatory</SelectItem>
            <SelectItem value="3">Poll</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-2 md:col-span-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Quick date filters
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
            Active now
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
            Upcoming
          </Button>
          <Button
            type="button"
            size="sm"
            variant={datePreset === DATE_PRESET_ENDED ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            onClick={() => applyDatePreset(DATE_PRESET_ENDED)}
          >
            Ended
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
            Starts this month
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs md:ml-auto"
            onClick={() => setIsDateFiltersExpanded((prev) => !prev)}
          >
            {isDateFiltersExpanded
              ? "Hide advanced date filters"
              : "Advanced date filters"}
          </Button>
        </div>

        {isDateFiltersExpanded ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40 md:col-span-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Survey Window Filters
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use start and end ranges to match how backend filters:
                <code className="ml-1 rounded bg-gray-200 px-1 py-0.5 text-[11px] dark:bg-gray-800">
                  start_from/start_to
                </code>
                and
                <code className="ml-1 rounded bg-gray-200 px-1 py-0.5 text-[11px] dark:bg-gray-800">
                  end_from/end_to
                </code>
                .
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Start Date Range
                </p>
                <label className="block text-xs text-gray-600 dark:text-gray-300">
                  Starts on or after
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
                  Starts on or before
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
                  End Date Range
                </p>
                <label className="block text-xs text-gray-600 dark:text-gray-300">
                  Ends on or after
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
                  Ends on or before
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
                  ? "Start date range is invalid: start_from must be before or equal to start_to."
                  : "End date range is invalid: end_from must be before or equal to end_to."}
              </p>
            ) : null}
          </div>
        ) : null}
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load surveys. Please try again.
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
                      aria-label="Select all surveys on this page"
                    />
                  ) : null}
                </TableHead>
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Scope</TableHead>
                <TableHead className="font-medium">Center</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Assignment</TableHead>
                <TableHead className="font-medium">Window</TableHead>
                <TableHead className="font-medium">Questions</TableHead>
                <TableHead className="font-medium">Submitted</TableHead>
                {hasActions ? (
                  <TableHead className="w-10 text-right font-medium">
                    Actions
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
                      title={query ? "No surveys found" : "No surveys yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Create your first survey to start collecting responses."
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((survey, index) => {
                  const shouldOpenUp = index >= Math.max(0, items.length - 2);

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
                      <TableCell>{getScopeBadge(survey)}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getCenterLabel(survey)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={survey.is_active ? "success" : "default"}
                        >
                          {survey.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getAssignmentLabel(survey)}
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
                                    Edit
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
                                    Assign
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
                                    Change Status
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
                                    Close
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
                                    View Results
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
                                    Delete
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
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBulkChangeStatus ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkChangeStatus(selectedSurveysList)}
                disabled={isLoadingState}
              >
                Change Status
              </Button>
            ) : null}
            {onBulkClose ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkClose(selectedSurveysList)}
                disabled={isLoadingState}
              >
                Close Surveys
              </Button>
            ) : null}
            {onBulkDelete ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onBulkDelete(selectedSurveysList)}
                disabled={isLoadingState}
              >
                Delete Surveys
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
