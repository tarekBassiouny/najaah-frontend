"use client";

import { useEffect, useMemo, useState } from "react";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import { useSchools } from "@/features/education/hooks/use-schools";
import type { School } from "@/features/education/types/education";
import {
  getEducationName,
  getSchoolTypeLabel,
  SCHOOL_TYPE_OPTIONS,
} from "@/features/education/types/education";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

const DEFAULT_PER_PAGE = 10;
const ALL_TYPE_VALUE = "all";
const ALL_STATUS_VALUE = "all";
const STATUS_ACTIVE_VALUE = "active";
const STATUS_INACTIVE_VALUE = "inactive";

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

type SchoolsTableProps = {
  centerId: string | number;
  onEdit?: (_school: School) => void;
  onDelete?: (_school: School) => void;
};

export function SchoolsTable({
  centerId,
  onEdit,
  onDelete,
}: SchoolsTableProps) {
  const { t, locale } = useTranslation();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPE_VALUE);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const isRtl = locale === "ar";

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      type: typeFilter === ALL_TYPE_VALUE ? undefined : Number(typeFilter),
      is_active:
        statusFilter === ALL_STATUS_VALUE
          ? undefined
          : statusFilter === STATUS_ACTIVE_VALUE,
    }),
    [page, perPage, query, typeFilter, statusFilter],
  );

  const { data, isLoading, isError, isFetching } = useSchools(centerId, params);
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const showEmptyState = !isLoading && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    typeFilter !== ALL_TYPE_VALUE ||
    statusFilter !== ALL_STATUS_VALUE;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (typeFilter !== ALL_TYPE_VALUE ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0);

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
  }, [centerId]);

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
          setTypeFilter(ALL_TYPE_VALUE);
          setStatusFilter(ALL_STATUS_VALUE);
          setPage(1);
        }}
        summary={
          <>
            {total === 1
              ? t("pages.education.tables.schools.summary", { count: total })
              : t("pages.education.tables.schools.summaryPlural", {
                  count: total,
                })}
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
            placeholder={t("pages.education.tables.schools.searchPlaceholder")}
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
            aria-label={t("pages.education.tables.schools.clearSearch")}
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
          value={typeFilter}
          onValueChange={(value) => {
            setPage(1);
            setTypeFilter(value);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={t("pages.education.tables.schools.filters.type")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPE_VALUE}>
              {t("pages.education.tables.schools.filters.allTypes")}
            </SelectItem>
            {SCHOOL_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
              placeholder={t("pages.education.tables.schools.filters.status")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              {t("pages.education.tables.schools.filters.allStatuses")}
            </SelectItem>
            <SelectItem value={STATUS_ACTIVE_VALUE}>
              {t("pages.education.tables.schools.filters.active")}
            </SelectItem>
            <SelectItem value={STATUS_INACTIVE_VALUE}>
              {t("pages.education.tables.schools.filters.inactive")}
            </SelectItem>
          </SelectContent>
        </Select>
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.education.tables.schools.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              {t("pages.education.tables.schools.retry")}
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
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="font-medium">
                  {t("pages.education.tables.schools.headers.name")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.education.tables.schools.headers.type")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.education.tables.schools.headers.address")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.education.tables.schools.headers.status")}
                </TableHead>
                <TableHead
                  className={cn(
                    "w-24 min-w-[96px] font-medium",
                    isRtl ? "text-left" : "text-right",
                  )}
                >
                  {t("pages.education.tables.schools.headers.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-52" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton
                          className={cn(
                            "h-4 w-6",
                            isRtl ? "mr-auto" : "ml-auto",
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48">
                    <EmptyState
                      title={
                        query
                          ? t(
                              "pages.education.tables.schools.empty.noResultsTitle",
                            )
                          : t(
                              "pages.education.tables.schools.empty.noDataTitle",
                            )
                      }
                      description={
                        query
                          ? t(
                              "pages.education.tables.schools.empty.noResultsDescription",
                            )
                          : t(
                              "pages.education.tables.schools.empty.noDataDescription",
                            )
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((school, _index) => {
                  const statusVariant =
                    school.is_active === false ? "secondary" : "success";

                  return (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {getEducationName(
                          school,
                          t("pages.education.tables.schools.entityName"),
                          locale,
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {getSchoolTypeLabel(school.type, school.type_label)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {school.address?.trim() ? school.address : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>
                          {school.is_active === false
                            ? t(
                                "pages.education.tables.schools.filters.inactive",
                              )
                            : t(
                                "pages.education.tables.schools.filters.active",
                              )}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          isRtl
                            ? "w-24 min-w-[96px] text-left align-middle"
                            : "w-24 min-w-[96px] text-right align-middle"
                        }
                      >
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === school.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? school.id : null)
                            }
                          >
                            <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                              ⋮
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className={cn(
                                "w-40 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                              )}
                            >
                              {onEdit ? (
                                <button
                                  className={cn(
                                    "w-full rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800",
                                    isRtl ? "text-right" : "text-left",
                                  )}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onEdit(school);
                                  }}
                                >
                                  {t(
                                    "pages.education.tables.schools.actions.edit",
                                  )}
                                </button>
                              ) : null}
                              {onDelete ? (
                                <button
                                  className={cn(
                                    "w-full rounded px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                                    isRtl ? "text-right" : "text-left",
                                  )}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onDelete(school);
                                  }}
                                >
                                  {t(
                                    "pages.education.tables.schools.actions.delete",
                                  )}
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
