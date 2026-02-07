import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  lastPage: number;
  isFetching?: boolean;
  onPageChange: (_page: number) => void;
  perPage: number;
  onPerPageChange: (_perPage: number) => void;
  perPageOptions?: readonly number[];
  className?: string;
  size?: "sm" | "default";
  labelClassName?: string;
};

const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export function PaginationControls({
  page,
  lastPage,
  isFetching = false,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  className,
  size = "default",
  labelClassName,
}: PaginationControlsProps) {
  const normalizedLastPage = Math.max(1, lastPage);
  const previousDisabled = page <= 1 || isFetching;
  const nextDisabled = page >= normalizedLastPage || isFetching;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "text-sm text-gray-500 dark:text-gray-400",
          labelClassName,
        )}
      >
        Page {page} of {normalizedLastPage}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm text-gray-500 dark:text-gray-400",
              labelClassName,
            )}
          >
            Rows
          </span>
          <Select
            value={String(perPage)}
            onValueChange={(value) => onPerPageChange(Number(value))}
            disabled={isFetching}
          >
            <SelectTrigger className="h-9 w-[86px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {perPageOptions.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={previousDisabled}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(Math.min(page + 1, normalizedLastPage))}
          disabled={nextDisabled}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
