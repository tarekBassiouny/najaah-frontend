import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

type StatsCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  loading,
  className,
  ...props
}: StatsCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
          className,
        )}
        {...props}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "flex items-center text-sm font-medium",
              trend.isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {trend.isPositive ? (
              <svg
                className="mr-0.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            ) : (
              <svg
                className="mr-0.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
        {description && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
