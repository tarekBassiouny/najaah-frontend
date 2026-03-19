import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

type StatsCardVariant = "default" | "success" | "warning" | "danger" | "info";

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
  variant?: StatsCardVariant;
  animationDelay?: number;
};

const VARIANT_STYLES: Record<
  StatsCardVariant,
  { border: string; iconBg: string; iconText: string }
> = {
  default: {
    border: "",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
  },
  success: {
    border: "border-l-4 border-l-emerald-500 dark:border-l-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    border: "border-l-4 border-l-amber-500 dark:border-l-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    border: "border-l-4 border-l-red-500 dark:border-l-red-400",
    iconBg: "bg-red-50 dark:bg-red-500/10",
    iconText: "text-red-600 dark:text-red-400",
  },
  info: {
    border: "border-l-4 border-l-blue-500 dark:border-l-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
  },
};

function formatMetricValue(value: string | number): string {
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return String(value);
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 10_000)
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return value.toLocaleString();
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  loading,
  variant = "default",
  animationDelay,
  className,
  style,
  ...props
}: StatsCardProps) {
  const variantStyle = VARIANT_STYLES[variant];

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
          variantStyle.border,
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

  const animationStyle =
    animationDelay !== undefined
      ? {
          ...style,
          animation: "statsCardIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
          animationDelay: `${animationDelay}ms`,
        }
      : style;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        variantStyle.border,
        animationDelay !== undefined && "opacity-0",
        className,
      )}
      style={animationStyle}
      {...props}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes statsCardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`,
        }}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatMetricValue(value)}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              variantStyle.iconBg,
              variantStyle.iconText,
            )}
          >
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
