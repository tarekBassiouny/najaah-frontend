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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSurveys } from "@/features/surveys/hooks/use-surveys";
import type { Survey } from "@/features/surveys/types/survey";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 20;

type SurveysTableProps = {
  centerId?: string | number;
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
  return "System";
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
  if (assignmentLabel) return assignmentLabel;

  if (survey.show_to_all_students) return "All Students";

  const singleAssignmentLabel = formatAssignment(survey.assignment);
  if (singleAssignmentLabel) return singleAssignmentLabel;

  return "—";
}

function getQuestionsCount(survey: Survey) {
  if (Array.isArray(survey.questions)) return survey.questions.length;
  return 0;
}

function getDateRange(survey: Survey) {
  const start = survey.start_at || "—";
  const end = survey.end_at || "—";
  return `${start} → ${end}`;
}

export function SurveysTable({
  centerId: centerIdProp,
  onDelete,
  onViewResults,
}: SurveysTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const normalizedCenterId = useMemo(() => {
    if (centerId == null) return undefined;
    const parsed = Number(centerId);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [centerId]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: normalizedCenterId,
    }),
    [page, perPage, query, normalizedCenterId],
  );

  const { data, isLoading, isError, isFetching } = useSurveys(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const maxPage = Math.max(1, data?.lastPage ?? Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const hasActions = Boolean(onDelete || onViewResults);

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
  }, [normalizedCenterId]);

  return (
    <ListingCard>
      <ListingFilters
        activeCount={search.trim() ? 1 : 0}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={Boolean(search.trim())}
        onClear={() => {
          setSearch("");
          setQuery("");
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "survey" : "surveys"}
          </>
        }
        gridClassName="grid-cols-1"
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
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Scope</TableHead>
                <TableHead className="font-medium">Center</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Assignment</TableHead>
                <TableHead className="font-medium">Window</TableHead>
                <TableHead className="font-medium">Questions</TableHead>
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
                    {hasActions ? (
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasActions ? 8 : 7} className="h-48">
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
