"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/features/localization";
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
  const { t, locale } = useTranslation();
  const normalizedLastPage = Math.max(1, lastPage);
  const previousDisabled = page <= 1 || isFetching;
  const nextDisabled = page >= normalizedLastPage || isFetching;
  const isRtl = locale === "ar";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        isRtl && "flex-row-reverse",
        className,
      )}
    >
      <div
        className={cn(
          "text-sm text-gray-500 dark:text-gray-400",
          isRtl && "text-right",
          labelClassName,
        )}
      >
        {t("common.pagination.pageOf", {
          page,
          lastPage: normalizedLastPage,
        })}
      </div>

      <div
        className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
      >
        <div
          className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
        >
          <span
            className={cn(
              "text-sm text-gray-500 dark:text-gray-400",
              isRtl && "text-right",
              labelClassName,
            )}
          >
            {t("common.pagination.rows")}
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
          {t("common.pagination.previous")}
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={() => onPageChange(Math.min(page + 1, normalizedLastPage))}
          disabled={nextDisabled}
        >
          {t("common.pagination.next")}
        </Button>
      </div>
    </div>
  );
}
