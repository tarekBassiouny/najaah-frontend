"use client";

import { useMemo, useState } from "react";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Category } from "@/features/categories/types/category";

const DEFAULT_PER_PAGE = 10;

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
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [parentId, setParentId] = useState<string>("all");

  const params = useMemo(
    () => ({
      page,
      per_page: DEFAULT_PER_PAGE,
      search: query || undefined,
      is_active:
        status === "all" ? undefined : status === "active",
      parent_id: parentId === "all" ? undefined : parentId,
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
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1);
      setQuery(search.trim());
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
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
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as "all" | "active" | "inactive");
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={parentId}
              onChange={(event) => {
                setPage(1);
                setParentId(event.target.value);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Parents</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryTitle(category)}
                </option>
              ))}
            </select>

            <div className="flex h-10 items-center justify-end text-sm text-gray-500 dark:text-gray-400">
              {total} {total === 1 ? "category" : "categories"}
            </div>
          </div>
        </div>

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Parent</TableHead>
                  <TableHead className="font-medium">Order</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="ml-auto h-8 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : showEmptyState ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48">
                      <EmptyState
                        title={query ? "No categories found" : "No categories yet"}
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
                  items.map((category) => (
                    <TableRow key={category.id} className="group">
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
                        <Badge variant={category.is_active ? "success" : "default"}>
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!isError && maxPage > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {maxPage}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
                disabled={page >= maxPage || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
