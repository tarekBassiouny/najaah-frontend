"use client";

import { useMemo, useState } from "react";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResourceTable,
  type ResourceTableColumn,
} from "@/components/ui/resource-table";
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

export function CategoriesTable({
  centerId,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    typeof ALL_STATUS_VALUE | typeof STATUS_ACTIVE_VALUE | typeof STATUS_INACTIVE_VALUE
  >(ALL_STATUS_VALUE);
  const [parentId, setParentId] = useState<string>(ALL_PARENTS_VALUE);

  const params = useMemo(
    () => ({
      page,
      per_page: DEFAULT_PER_PAGE,
      search: query || undefined,
      is_active:
        status === ALL_STATUS_VALUE
          ? undefined
          : status === STATUS_ACTIVE_VALUE,
      parent_id: parentId === ALL_PARENTS_VALUE ? undefined : parentId,
    }),
    [page, query, status, parentId],
  );

  const parentFilterParams = useMemo(
    () => ({
      page: 1,
      per_page: 100,
    }),
    [],
  );

  const { data, isLoading, isError, isFetching } = useCategories(centerId, params);
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
  const maxPage = Math.max(1, Math.ceil(total / DEFAULT_PER_PAGE));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      setQuery(search.trim());
    }
  };

  const columns = useMemo<ResourceTableColumn<Category>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        cellClassName: "font-medium text-gray-900 dark:text-white",
        render: (category) => getCategoryTitle(category),
      },
      {
        id: "parent",
        header: "Parent",
        cellClassName: "text-gray-500 dark:text-gray-400",
        render: (category) => getParentLabel(category, parentLabelMap),
      },
      {
        id: "order",
        header: "Order",
        cellClassName: "text-gray-500 dark:text-gray-400",
        render: (category) => category.order_index ?? "—",
      },
      {
        id: "status",
        header: "Status",
        render: (category) => (
          <Badge variant={category.is_active ? "success" : "default"}>
            {category.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (category) => (
          <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(category)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-600"
              onClick={() => onDelete?.(category)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit, parentLabelMap],
  );

  return (
    <ResourceTable
      columns={columns}
      rows={items}
      rowKey={(category) => category.id}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      emptyTitle={query ? "No categories found" : "No categories yet"}
      emptyDescription={
        query
          ? "Try adjusting your search terms"
          : "Create a category to start organizing your content"
      }
      onRetry={() => window.location.reload()}
      toolbar={(
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
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
              onKeyDown={handleKeyDown}
              placeholder="Search categories..."
              className="pl-10"
            />
          </div>

          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
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
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS_VALUE}>All Statuses</SelectItem>
                <SelectItem value={STATUS_ACTIVE_VALUE}>Active</SelectItem>
                <SelectItem value={STATUS_INACTIVE_VALUE}>Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={parentId}
              onValueChange={(value) => {
                setPage(1);
                setParentId(value);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
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

            <div className="flex h-10 items-center justify-end text-sm text-gray-500 dark:text-gray-400">
              {total} {total === 1 ? "category" : "categories"}
            </div>
          </div>
        </div>
      )}
      pagination={{
        page,
        lastPage: maxPage,
        onPrevious: () => setPage((prev) => Math.max(prev - 1, 1)),
        onNext: () => setPage((prev) => Math.min(prev + 1, maxPage)),
        disablePrevious: page <= 1 || isFetching,
        disableNext: page >= maxPage || isFetching,
      }}
    />
  );
}
