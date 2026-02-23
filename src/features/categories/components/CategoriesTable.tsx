"use client";

import { useEffect, useMemo, useState } from "react";
import { useCategories } from "@/features/categories/hooks/use-categories";
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
import { cn } from "@/lib/utils";
import type { Category } from "@/features/categories/types/category";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const STATUS_ACTIVE_VALUE = "active";
const STATUS_INACTIVE_VALUE = "inactive";
const ALL_PARENTS_VALUE = "all";

type CategoriesTableProps = {
  centerId: string | number;
  onEdit?: (_item: Category) => void;
  onDelete?: (_item: Category) => void;
  onBulkChangeStatus?: (_items: Category[]) => void;
  onBulkDelete?: (_items: Category[]) => void;
};

function getCategoryTitle(category: Category) {
  const translations = category.title_translations;
  if (translations?.en) return translations.en;
  if (translations?.ar) return translations.ar;
  if (category.title) return String(category.title);
  if (category.name) return String(category.name);
  return `Category #${category.id}`;
}

function getParentLabel(category: Category, parentMap: Map<string, string>) {
  if (category.parent_id == null) return "—";
  const key = String(category.parent_id);
  return parentMap.get(key) ?? `#${key}`;
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

export function CategoriesTable({
  centerId,
  onEdit,
  onDelete,
  onBulkChangeStatus,
  onBulkDelete,
}: CategoriesTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    | typeof ALL_STATUS_VALUE
    | typeof STATUS_ACTIVE_VALUE
    | typeof STATUS_INACTIVE_VALUE
  >(ALL_STATUS_VALUE);
  const [parentId, setParentId] = useState<string>(ALL_PARENTS_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, Category>
  >({});

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      is_active:
        status === ALL_STATUS_VALUE
          ? undefined
          : status === STATUS_ACTIVE_VALUE,
      parent_id: parentId === ALL_PARENTS_VALUE ? undefined : parentId,
    }),
    [page, perPage, query, status, parentId],
  );

  const parentFilterParams = useMemo(
    () => ({
      page: 1,
      per_page: 100,
    }),
    [],
  );

  const { data, isLoading, isError, isFetching } = useCategories(
    centerId,
    params,
  );
  const { data: parentData } = useCategories(centerId, parentFilterParams, {
    staleTime: 1000 * 60,
  });

  const items = data?.items ?? [];
  const parentOptions = useMemo(() => parentData?.items ?? [], [parentData]);
  const parentLabelMap = useMemo(
    () =>
      new Map(
        parentOptions.map((category) => [
          String(category.id),
          getCategoryTitle(category),
        ]),
      ),
    [parentOptions],
  );
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  const hasActiveFilters =
    search.trim().length > 0 ||
    status !== ALL_STATUS_VALUE ||
    parentId !== ALL_PARENTS_VALUE;

  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (status !== ALL_STATUS_VALUE ? 1 : 0) +
    (parentId !== ALL_PARENTS_VALUE ? 1 : 0);

  const selectedIds = useMemo(
    () => Object.keys(selectedCategories),
    [selectedCategories],
  );
  const selectedCount = selectedIds.length;
  const selectedCategoriesList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedCategories[id])
        .filter((category): category is Category => Boolean(category)),
    [selectedIds, selectedCategories],
  );
  const pageCategoryIds = useMemo(
    () => items.map((category) => String(category.id)),
    [items],
  );
  const isAllPageSelected =
    pageCategoryIds.length > 0 &&
    pageCategoryIds.every((id) => selectedCategories[id]);

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

  useEffect(() => {
    setSelectedCategories({});
  }, [centerId, page, perPage, query, status, parentId]);

  const toggleCategorySelection = (category: Category) => {
    const categoryId = String(category.id);
    setSelectedCategories((prev) => {
      if (prev[categoryId]) {
        const { [categoryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [categoryId]: category };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedCategories((prev) => {
        if (pageCategoryIds.length === 0) return prev;
        const next = { ...prev };
        pageCategoryIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedCategories((prev) => {
      const next = { ...prev };
      items.forEach((category) => {
        next[String(category.id)] = category;
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
          setStatus(ALL_STATUS_VALUE);
          setParentId(ALL_PARENTS_VALUE);
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "category" : "categories"}
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
            placeholder="Search categories..."
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
          value={parentId}
          onValueChange={(value) => {
            setPage(1);
            setParentId(value);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder="Parent Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PARENTS_VALUE}>All Parents</SelectItem>
            {parentOptions.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {getCategoryTitle(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1);
            setStatus(
              value as
                | typeof ALL_STATUS_VALUE
                | typeof STATUS_ACTIVE_VALUE
                | typeof STATUS_INACTIVE_VALUE,
            );
          }}
        >
          <SelectTrigger
            className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            icon={<StatusIcon />}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>All Statuses</SelectItem>
            <SelectItem value={STATUS_ACTIVE_VALUE}>Active</SelectItem>
            <SelectItem value={STATUS_INACTIVE_VALUE}>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load categories. Please try again.
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all categories on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Parent</TableHead>
                <TableHead className="font-medium">Order</TableHead>
                <TableHead className="font-medium">Status</TableHead>
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
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-6" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState
                      title={
                        query ? "No categories found" : "No categories yet"
                      }
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Create a category to start organizing your content"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((category, index) => {
                  const shouldOpenUp = index >= Math.max(0, items.length - 2);

                  return (
                    <TableRow
                      key={category.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(
                            selectedCategories[String(category.id)],
                          )}
                          onChange={() => toggleCategorySelection(category)}
                          aria-label={`Select ${getCategoryTitle(category)}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {getCategoryTitle(category)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {getParentLabel(category, parentLabelMap)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {category.order_index ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.is_active ? "success" : "default"}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === category.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? category.id : null)
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
                                  onEdit?.(category);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDelete?.(category);
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

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkChangeStatus?.(selectedCategoriesList)}
              disabled={isLoadingState}
            >
              Change Status
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-600"
              onClick={() => onBulkDelete?.(selectedCategoriesList)}
              disabled={isLoadingState}
            >
              Delete
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
