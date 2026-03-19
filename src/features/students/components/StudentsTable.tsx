"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Student } from "@/features/students/types/student";
import { useStudents } from "@/features/students/hooks/use-students";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { formatDateTime } from "@/lib/format-date-time";
import { cn } from "@/lib/utils";
import { resolveStudentStatus } from "@/features/students/utils/student-status";
import {
  EDUCATIONAL_STAGE_OPTIONS,
  getEducationName,
} from "@/features/education/types/education";
import { useGradeOptions } from "@/features/education/hooks/use-grade-options";
import { useSchoolOptions } from "@/features/education/hooks/use-school-options";
import { useCollegeOptions } from "@/features/education/hooks/use-college-options";
import { useTranslation } from "@/features/localization";
import { useLocale } from "@/features/localization/locale-context";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_CENTER_TYPE_VALUE = "all";
const ALL_STAGE_VALUE = "all";
const ALL_GRADE_VALUE = "all";
const ALL_SCHOOL_VALUE = "all";
const ALL_COLLEGE_VALUE = "all";
type CenterTypeFilterValue =
  | typeof ALL_CENTER_TYPE_VALUE
  | "branded"
  | "unbranded";

function normalizeWhatsAppNumber(
  countryCode?: string | null,
  phone?: string | null,
): string | null {
  const normalizedCountryCode = (countryCode ?? "").replace(/\D/g, "");
  const normalizedPhone = (phone ?? "").replace(/\D/g, "");
  const combined = `${normalizedCountryCode}${normalizedPhone}`;

  return combined ? combined : null;
}

function getInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const StatusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.6}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75h7.5a2.25 2.25 0 002.25-2.25v-1.125a2.25 2.25 0 00-2.25-2.25h-7.5A2.25 2.25 0 006 15.375V16.5a2.25 2.25 0 002.25 2.25zM8.25 10.875h7.5a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25h-7.5A2.25 2.25 0 006 7.5v1.125a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

type StudentsTableProps = {
  centerId?: string | number;
  courseId?: string | number;
  showCenterFilter?: boolean;
  initialPage?: number;
  initialPerPage?: number;
  buildProfileHref?: (_student: Student) => string | null;
  onEdit?: (_student: Student) => void;
  onDelete?: (_student: Student) => void;
  onViewDetails?: (_student: Student) => void;
  onEnrollCourse?: (_student: Student) => void;
  onGenerateAccessCode?: (_student: Student) => void;
  onBulkEnrollCourse?: (_students: Student[]) => void;
  onBulkChangeStatus?: (_students: Student[]) => void;
  onBulkGenerateAccessCodes?: (_students: Student[]) => void;
  onBulkEnrollAndGenerate?: (_students: Student[]) => void;
};

export function StudentsTable({
  centerId: centerIdProp,
  courseId,
  showCenterFilter = true,
  initialPage,
  initialPerPage,
  buildProfileHref,
  onEdit,
  onDelete,
  onViewDetails,
  onEnrollCourse,
  onGenerateAccessCode,
  onBulkEnrollCourse,
  onBulkChangeStatus,
  onBulkGenerateAccessCodes,
  onBulkEnrollAndGenerate,
}: StudentsTableProps) {
  const { t } = useTranslation();
  const emptyValue = t("pages.students.fallbacks.noValue");
  const { locale } = useLocale();
  const isRtl = locale === "ar";
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const isCenterScoped = Boolean(centerIdProp);
  const [page, setPage] = useState(initialPage ?? 1);
  const [perPage, setPerPage] = useState<number>(
    initialPerPage ?? DEFAULT_PER_PAGE,
  );
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [stageFilter, setStageFilter] = useState<string>(ALL_STAGE_VALUE);
  const [gradeFilter, setGradeFilter] = useState<string>(ALL_GRADE_VALUE);
  const [schoolFilter, setSchoolFilter] = useState<string>(ALL_SCHOOL_VALUE);
  const [collegeFilter, setCollegeFilter] = useState<string>(ALL_COLLEGE_VALUE);
  const [centerTypeFilter, setCenterTypeFilter] =
    useState<CenterTypeFilterValue>(ALL_CENTER_TYPE_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<
    Record<string, Student>
  >({});
  const canLoadEducationOptions = Boolean(centerId);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: centerId,
      course_id: courseId,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
      // Center type filter only for system scope
      type:
        isCenterScoped || centerTypeFilter === ALL_CENTER_TYPE_VALUE
          ? undefined
          : centerTypeFilter,
      stage:
        canLoadEducationOptions && stageFilter !== ALL_STAGE_VALUE
          ? stageFilter
          : undefined,
      grade_id: gradeFilter === ALL_GRADE_VALUE ? undefined : gradeFilter,
      school_id: schoolFilter === ALL_SCHOOL_VALUE ? undefined : schoolFilter,
      college_id:
        collegeFilter === ALL_COLLEGE_VALUE ? undefined : collegeFilter,
    }),
    [
      page,
      perPage,
      query,
      centerId,
      courseId,
      statusFilter,
      centerTypeFilter,
      isCenterScoped,
      canLoadEducationOptions,
      stageFilter,
      gradeFilter,
      schoolFilter,
      collegeFilter,
    ],
  );

  const stageValueForOptions =
    canLoadEducationOptions && stageFilter !== ALL_STAGE_VALUE
      ? Number(stageFilter)
      : undefined;

  const {
    options: gradeOptions,
    search: gradeSearch,
    setSearch: setGradeSearch,
    isLoading: isGradeOptionsLoading,
  } = useGradeOptions({
    centerId: centerId ?? undefined,
    selectedValue: gradeFilter === ALL_GRADE_VALUE ? null : gradeFilter,
    stage: stageValueForOptions,
    includeAllOption: true,
    allOptionValue: ALL_GRADE_VALUE,
    allOptionLabel: t("pages.students.table.filters.grade"),
    enabled: canLoadEducationOptions,
  });
  const {
    options: schoolOptions,
    search: schoolSearch,
    setSearch: setSchoolSearch,
    isLoading: isSchoolOptionsLoading,
  } = useSchoolOptions({
    centerId: centerId ?? undefined,
    selectedValue: schoolFilter === ALL_SCHOOL_VALUE ? null : schoolFilter,
    includeAllOption: true,
    allOptionValue: ALL_SCHOOL_VALUE,
    allOptionLabel: t("pages.students.table.filters.school"),
    enabled: canLoadEducationOptions,
  });
  const {
    options: collegeOptions,
    search: collegeSearch,
    setSearch: setCollegeSearch,
    isLoading: isCollegeOptionsLoading,
  } = useCollegeOptions({
    centerId: centerId ?? undefined,
    selectedValue: collegeFilter === ALL_COLLEGE_VALUE ? null : collegeFilter,
    includeAllOption: true,
    allOptionValue: ALL_COLLEGE_VALUE,
    allOptionLabel: t("pages.students.table.filters.college"),
    enabled: canLoadEducationOptions,
  });

  const { data, isLoading, isError, isFetching } = useStudents(params, {
    centerId: centerId ?? null,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== ALL_STATUS_VALUE ||
    (canLoadEducationOptions && stageFilter !== ALL_STAGE_VALUE) ||
    (canLoadEducationOptions && gradeFilter !== ALL_GRADE_VALUE) ||
    (canLoadEducationOptions && schoolFilter !== ALL_SCHOOL_VALUE) ||
    (canLoadEducationOptions && collegeFilter !== ALL_COLLEGE_VALUE) ||
    (!isCenterScoped && centerTypeFilter !== ALL_CENTER_TYPE_VALUE);
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (canLoadEducationOptions && stageFilter !== ALL_STAGE_VALUE ? 1 : 0) +
    (canLoadEducationOptions && gradeFilter !== ALL_GRADE_VALUE ? 1 : 0) +
    (canLoadEducationOptions && schoolFilter !== ALL_SCHOOL_VALUE ? 1 : 0) +
    (canLoadEducationOptions && collegeFilter !== ALL_COLLEGE_VALUE ? 1 : 0) +
    (!isCenterScoped && centerTypeFilter !== ALL_CENTER_TYPE_VALUE ? 1 : 0);
  const selectedIds = useMemo(
    () => Object.keys(selectedStudents),
    [selectedStudents],
  );
  const selectedCount = selectedIds.length;
  const selectedStudentsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedStudents[id])
        .filter((student): student is Student => Boolean(student)),
    [selectedIds, selectedStudents],
  );
  const pageStudentIds = useMemo(
    () => items.map((student) => String(student.id)),
    [items],
  );
  const isAllPageSelected =
    pageStudentIds.length > 0 &&
    pageStudentIds.every((id) => selectedStudents[id]);

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
  }, [centerId, courseId]);

  useEffect(() => {
    if (centerId) return;
    setStageFilter(ALL_STAGE_VALUE);
    setGradeFilter(ALL_GRADE_VALUE);
    setSchoolFilter(ALL_SCHOOL_VALUE);
    setCollegeFilter(ALL_COLLEGE_VALUE);
  }, [centerId]);

  useEffect(() => {
    setSelectedStudents({});
  }, [
    centerId,
    courseId,
    page,
    perPage,
    query,
    statusFilter,
    stageFilter,
    gradeFilter,
    schoolFilter,
    collegeFilter,
    centerTypeFilter,
  ]);

  const hasActions = Boolean(
    onEdit || onDelete || onViewDetails || onEnrollCourse || buildProfileHref,
  );
  const showWhatsAppAction = !isCenterScoped;

  const toggleStudentSelection = (student: Student) => {
    const studentId = String(student.id);
    setSelectedStudents((prev) => {
      if (prev[studentId]) {
        const { [studentId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [studentId]: student };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedStudents((prev) => {
        if (pageStudentIds.length === 0) return prev;
        const next = { ...prev };
        pageStudentIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedStudents((prev) => {
      const next = { ...prev };
      items.forEach((student) => {
        next[String(student.id)] = student;
      });
      return next;
    });
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
          setStageFilter(ALL_STAGE_VALUE);
          setGradeFilter(ALL_GRADE_VALUE);
          setSchoolFilter(ALL_SCHOOL_VALUE);
          setCollegeFilter(ALL_COLLEGE_VALUE);
          setCenterTypeFilter(ALL_CENTER_TYPE_VALUE);
          setPage(1);
        }}
        summary={
          <>
            {total === 1
              ? t("pages.students.table.summary", { count: total })
              : t("pages.students.table.summaryPlural", { count: total })}
          </>
        }
        gridClassName={
          showCenterFilter && !isCenterScoped
            ? "grid-cols-1 md:grid-cols-3 xl:grid-cols-4"
            : isCenterScoped
              ? "grid-cols-1 md:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 md:grid-cols-3"
        }
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
            placeholder={t("pages.students.table.searchPlaceholder")}
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
            aria-label={t("pages.students.table.clearSearch")}
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

        {showCenterFilter && !isCenterScoped ? (
          <CenterPicker
            className="w-full min-w-0"
            hideWhenCenterScoped={false}
            selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        ) : null}

        {!isCenterScoped ? (
          <Select
            value={centerTypeFilter}
            onValueChange={(value) => {
              setPage(1);
              if (
                value === ALL_CENTER_TYPE_VALUE ||
                value === "branded" ||
                value === "unbranded"
              ) {
                setCenterTypeFilter(value);
                return;
              }
              setCenterTypeFilter(ALL_CENTER_TYPE_VALUE);
            }}
          >
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue
                placeholder={t("pages.students.table.filters.centerType")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CENTER_TYPE_VALUE}>
                {t("pages.students.table.filters.centerType")}
              </SelectItem>
              <SelectItem value="branded">
                {t("pages.students.table.filters.branded")}
              </SelectItem>
              <SelectItem value="unbranded">
                {t("pages.students.table.filters.unbranded")}
              </SelectItem>
            </SelectContent>
          </Select>
        ) : null}

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
        >
          <SelectTrigger
            className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            icon={<StatusIcon />}
          >
            <SelectValue
              placeholder={t("pages.students.table.filters.status")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              {t("pages.students.table.filters.status")}
            </SelectItem>
            <SelectItem value="1">
              {t("pages.students.table.filters.active")}
            </SelectItem>
            <SelectItem value="0">
              {t("pages.students.table.filters.inactive")}
            </SelectItem>
            <SelectItem value="2">
              {t("pages.students.table.filters.banned")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          disabled={!canLoadEducationOptions}
          value={stageFilter}
          onValueChange={(value) => {
            setPage(1);
            setStageFilter(value);
            setGradeFilter(ALL_GRADE_VALUE);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={
                canLoadEducationOptions
                  ? t("pages.students.table.filters.stage")
                  : t("pages.students.table.filters.selectCenterFirst")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STAGE_VALUE}>
              {t("pages.students.table.filters.stage")}
            </SelectItem>
            {EDUCATIONAL_STAGE_OPTIONS.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SearchableSelect
          value={gradeFilter}
          onValueChange={(value) => {
            setPage(1);
            setGradeFilter(value ?? ALL_GRADE_VALUE);
          }}
          options={gradeOptions}
          searchValue={gradeSearch}
          onSearchValueChange={setGradeSearch}
          placeholder={
            canLoadEducationOptions
              ? t("pages.students.table.filters.grade")
              : t("pages.students.table.filters.selectCenterFirst")
          }
          searchPlaceholder={t("pages.students.table.filters.searchGrades")}
          emptyMessage={
            canLoadEducationOptions
              ? t("pages.students.table.filters.noGrades")
              : t("pages.students.table.filters.selectCenterFirst")
          }
          isLoading={isGradeOptionsLoading}
          filterOptions={false}
          showSearch
          disabled={!canLoadEducationOptions}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <SearchableSelect
          value={schoolFilter}
          onValueChange={(value) => {
            setPage(1);
            setSchoolFilter(value ?? ALL_SCHOOL_VALUE);
          }}
          options={schoolOptions}
          searchValue={schoolSearch}
          onSearchValueChange={setSchoolSearch}
          placeholder={
            canLoadEducationOptions
              ? t("pages.students.table.filters.school")
              : t("pages.students.table.filters.selectCenterFirst")
          }
          searchPlaceholder={t("pages.students.table.filters.searchSchools")}
          emptyMessage={
            canLoadEducationOptions
              ? t("pages.students.table.filters.noSchools")
              : t("pages.students.table.filters.selectCenterFirst")
          }
          isLoading={isSchoolOptionsLoading}
          filterOptions={false}
          showSearch
          disabled={!canLoadEducationOptions}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <SearchableSelect
          value={collegeFilter}
          onValueChange={(value) => {
            setPage(1);
            setCollegeFilter(value ?? ALL_COLLEGE_VALUE);
          }}
          options={collegeOptions}
          searchValue={collegeSearch}
          onSearchValueChange={setCollegeSearch}
          placeholder={
            canLoadEducationOptions
              ? t("pages.students.table.filters.college")
              : t("pages.students.table.filters.selectCenterFirst")
          }
          searchPlaceholder={t("pages.students.table.filters.searchColleges")}
          emptyMessage={
            canLoadEducationOptions
              ? t("pages.students.table.filters.noColleges")
              : t("pages.students.table.filters.selectCenterFirst")
          }
          isLoading={isCollegeOptionsLoading}
          filterOptions={false}
          showSearch
          disabled={!canLoadEducationOptions}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.students.table.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              {t("pages.students.table.retry")}
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
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label={t("pages.students.table.selectAll")}
                  />
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.student")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.status")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.center")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.education")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.activity")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.lastActivity")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.students.table.headers.device")}
                </TableHead>
                {hasActions && (
                  <TableHead
                    className={cn(
                      "w-24 min-w-[96px] font-medium",
                      isRtl ? "text-left" : "text-right",
                    )}
                  >
                    {t("pages.students.table.headers.actions")}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-12 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      {hasActions && (
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={hasActions ? 9 : 8} className="h-48">
                    <EmptyState
                      title={
                        query
                          ? t("pages.students.table.empty.noResultsTitle")
                          : t("pages.students.table.empty.noDataTitle")
                      }
                      description={
                        query
                          ? t("pages.students.table.empty.noResultsDescription")
                          : t("pages.students.table.empty.noDataDescription")
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((student, _index) => {
                  const status = resolveStudentStatus(
                    student.status_key ?? student.status,
                    student.status_label,
                    t,
                  );
                  const analytics = student.analytics ?? null;
                  const device = student.device ?? null;
                  const deviceName =
                    device?.device_name ?? device?.model ?? null;
                  const deviceType = device?.device_type ?? null;
                  const deviceMeta = [deviceType, device?.os_version]
                    .filter(Boolean)
                    .join(" · ");
                  const deviceStatusLabel =
                    device?.status_label ??
                    device?.status_key ??
                    t("pages.students.table.status.active");
                  const activityLabel = analytics
                    ? `${analytics.total_enrollments ?? 0} ${t("pages.students.table.activity.enrollments")} · ${
                        analytics.total_sessions ?? 0
                      } ${t("pages.students.table.activity.sessions")}`
                    : emptyValue;
                  const gradeLabel = student.grade
                    ? getEducationName(
                        student.grade,
                        t("pages.students.table.filters.grade"),
                      )
                    : emptyValue;
                  const schoolLabel = student.school
                    ? getEducationName(
                        student.school,
                        t("pages.students.table.filters.school"),
                      )
                    : emptyValue;
                  const collegeLabel = student.college
                    ? getEducationName(
                        student.college,
                        t("pages.students.table.filters.college"),
                      )
                    : emptyValue;
                  const lastActivityLabel = analytics?.last_activity_at
                    ? formatDateTime(analytics.last_activity_at)
                    : emptyValue;
                  const profileHref = buildProfileHref?.(student) ?? null;
                  const whatsappNumber = normalizeWhatsAppNumber(
                    student.country_code,
                    student.phone,
                  );
                  const whatsappHref = whatsappNumber
                    ? `https://wa.me/${whatsappNumber}`
                    : null;

                  return (
                    <TableRow
                      key={student.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(
                            selectedStudents[String(student.id)],
                          )}
                          onChange={() => toggleStudentSelection(student)}
                          aria-label={t("pages.students.table.selectStudent", {
                            name:
                              student.name ??
                              t("pages.students.fallbacks.studentById", {
                                id: student.id,
                              }),
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {getInitials(
                              student.name ??
                                student.email ??
                                t("pages.students.fallbacks.studentById", {
                                  id: student.id ?? "",
                                }),
                            )}
                          </div>
                          <div className="flex flex-col">
                            {profileHref ? (
                              <Link
                                href={profileHref}
                                className="font-medium text-gray-900 transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
                              >
                                {student.name ?? emptyValue}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-900 dark:text-white">
                                {student.name ?? emptyValue}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{student.phone ?? emptyValue}</span>
                              {showWhatsAppAction ? (
                                whatsappHref ? (
                                  <Link
                                    href={whatsappHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                                    aria-label={t(
                                      "pages.students.table.actions.openWhatsappFor",
                                      {
                                        name:
                                          student.name ??
                                          t(
                                            "pages.students.fallbacks.studentById",
                                            {
                                              id: student.id,
                                            },
                                          ),
                                      },
                                    )}
                                    title={t(
                                      "pages.students.table.actions.openWhatsapp",
                                    )}
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      aria-hidden="true"
                                    >
                                      <path d="M20.52 3.48A11.8 11.8 0 0012.11 0C5.6 0 .3 5.3.3 11.82c0 2.08.54 4.11 1.56 5.9L0 24l6.46-1.7a11.78 11.78 0 005.64 1.43h.01c6.51 0 11.8-5.3 11.8-11.82 0-3.16-1.23-6.13-3.39-8.43zm-8.41 18.2h-.01a9.8 9.8 0 01-4.99-1.36l-.36-.21-3.84 1.01 1.03-3.74-.24-.38a9.83 9.83 0 01-1.5-5.18c0-5.42 4.4-9.83 9.82-9.83 2.62 0 5.08 1.02 6.93 2.88a9.76 9.76 0 012.88 6.95c0 5.42-4.41 9.86-9.82 9.86zm5.39-7.37c-.3-.15-1.77-.87-2.05-.96-.27-.1-.47-.15-.67.15s-.77.96-.94 1.15c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47a9 9 0 01-1.66-2.06c-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.91-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.46s1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.49 1.68.62.71.23 1.36.2 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.08-.12-.28-.2-.58-.35z" />
                                    </svg>
                                  </Link>
                                ) : (
                                  <span
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                    aria-hidden="true"
                                    title={t(
                                      "pages.students.table.actions.phoneUnavailable",
                                    )}
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M20.52 3.48A11.8 11.8 0 0012.11 0C5.6 0 .3 5.3.3 11.82c0 2.08.54 4.11 1.56 5.9L0 24l6.46-1.7a11.78 11.78 0 005.64 1.43h.01c6.51 0 11.8-5.3 11.8-11.82 0-3.16-1.23-6.13-3.39-8.43zm-8.41 18.2h-.01a9.8 9.8 0 01-4.99-1.36l-.36-.21-3.84 1.01 1.03-3.74-.24-.38a9.83 9.83 0 01-1.5-5.18c0-5.42 4.4-9.83 9.82-9.83 2.62 0 5.08 1.02 6.93 2.88a9.76 9.76 0 012.88 6.95c0 5.42-4.41 9.86-9.82 9.86z" />
                                    </svg>
                                  </span>
                                )
                              ) : null}
                            </div>
                            {student.email ? (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {student.email}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.status != null || student.status_label ? (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        ) : (
                          emptyValue
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {student.center?.name ??
                          student.center?.id ??
                          student.center_id ??
                          t("pages.students.table.fallbackCenter")}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <div className="min-w-[170px] space-y-1 text-xs">
                          <p className="truncate">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                              {t("pages.students.table.education.grade")}
                            </span>{" "}
                            {gradeLabel}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                              {t("pages.students.table.education.school")}
                            </span>{" "}
                            {schoolLabel}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                              {t("pages.students.table.education.college")}
                            </span>{" "}
                            {collegeLabel}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {activityLabel}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {lastActivityLabel}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {device ? (
                          <div className="min-w-[170px] space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              </span>
                              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {deviceName ??
                                  t(
                                    "pages.students.table.device.connectedDevice",
                                  )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="success">
                                {deviceStatusLabel}
                              </Badge>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {deviceMeta ||
                                  t(
                                    "pages.students.table.device.deviceConnected",
                                  )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="min-w-[170px] space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              </span>
                              <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("pages.students.table.device.noDevice")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {t("pages.students.table.device.none")}
                              </Badge>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {t("pages.students.table.device.notLinkedYet")}
                              </p>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      {hasActions && (
                        <TableCell
                          className={
                            isRtl
                              ? "w-24 min-w-[96px] text-left align-middle"
                              : "w-24 min-w-[96px] text-right align-middle"
                          }
                        >
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === student.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? student.id : null)
                              }
                            >
                              <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                                ⋮
                              </DropdownTrigger>
                              <DropdownContent
                                align="end"
                                className={cn(
                                  "w-44 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                )}
                              >
                                {profileHref ? (
                                  <Link
                                    href={profileHref}
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    {t(
                                      "pages.students.table.actions.viewProfile",
                                    )}
                                  </Link>
                                ) : null}
                                {onViewDetails && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onViewDetails(student);
                                    }}
                                  >
                                    {t(
                                      "pages.students.table.actions.viewDetails",
                                    )}
                                  </button>
                                )}
                                {onEnrollCourse && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEnrollCourse(student);
                                    }}
                                  >
                                    {t(
                                      "pages.students.table.actions.enrollInCourse",
                                    )}
                                  </button>
                                )}
                                {onGenerateAccessCode && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onGenerateAccessCode(student);
                                    }}
                                  >
                                    {t(
                                      "pages.students.table.actions.generateAccessCode",
                                    )}
                                  </button>
                                )}
                                {onEdit && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit(student);
                                    }}
                                  >
                                    {t(
                                      "pages.students.table.actions.editProfile",
                                    )}
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDelete(student);
                                    }}
                                  >
                                    {t("pages.students.table.actions.delete")}
                                  </button>
                                )}
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {t("pages.students.table.bulk.selected", { count: selectedCount })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkEnrollCourse?.(selectedStudentsList)}
              disabled={isLoadingState}
            >
              {t("pages.students.table.bulk.enrollToCourse")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkGenerateAccessCodes?.(selectedStudentsList)}
              disabled={isLoadingState}
            >
              {t("pages.students.table.bulk.generateAccessCodes")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkChangeStatus?.(selectedStudentsList)}
              disabled={isLoadingState}
            >
              {t("pages.students.table.bulk.changeStatus")}
            </Button>
            <Button
              size="sm"
              onClick={() => onBulkEnrollAndGenerate?.(selectedStudentsList)}
              disabled={isLoadingState}
            >
              {t("pages.students.table.bulk.enrollAndGenerate")}
            </Button>
          </div>
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
