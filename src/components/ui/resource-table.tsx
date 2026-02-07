import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ResourceTableColumn<T> = {
  id: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (_row: T) => ReactNode;
};

type ResourceTableProps<T> = {
  columns: ResourceTableColumn<T>[];
  rows: T[];
  rowKey: (_row: T) => string | number;
  toolbar?: ReactNode;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  loadingRows?: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  errorDescription?: string;
  onRetry?: () => void;
  pagination?: {
    page: number;
    lastPage: number;
    onPrevious: () => void;
    onNext: () => void;
    disablePrevious?: boolean;
    disableNext?: boolean;
  };
};

export function ResourceTable<T>({
  columns,
  rows,
  rowKey,
  toolbar,
  isLoading,
  isFetching,
  isError,
  loadingRows = 5,
  emptyTitle,
  emptyDescription,
  emptyAction,
  errorDescription = "Failed to load data. Please try again.",
  onRetry,
  pagination,
}: ResourceTableProps<T>) {
  const isLoadingState = Boolean(isLoading || isFetching);
  const showEmptyState = !isLoadingState && !isError && rows.length === 0;

  return (
    <Card>
      <CardContent className="p-0">
        {toolbar}

        {isError ? (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorDescription}
              </p>
              {onRetry ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onRetry}
                >
                  Retry
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  {columns.map((column) => (
                    <TableHead
                      key={column.id}
                      className={column.headerClassName}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  Array.from({ length: loadingRows }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      {columns.map((column) => (
                        <TableCell key={`${column.id}-${index}`}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : showEmptyState ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-48">
                      <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                        action={emptyAction}
                        className="border-0 bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={rowKey(row)} className="group">
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={column.cellClassName}
                        >
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination && pagination.lastPage > 1 && !isError ? (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.lastPage}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.onPrevious}
                disabled={pagination.disablePrevious}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.onNext}
                disabled={pagination.disableNext}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
