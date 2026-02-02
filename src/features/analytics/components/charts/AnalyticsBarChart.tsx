"use client";

import { useMemo } from "react";

type AnalyticsBarChartProps = {
  title?: string;
  categories: string[];
  values: number[];
  color?: string;
  height?: number;
};

/**
 * CSS-based bar chart visualization.
 * ApexCharts is disabled due to React 19 compatibility issues.
 * See: https://github.com/apexcharts/react-apexcharts/issues/475
 */
export function AnalyticsBarChart({
  title,
  categories,
  values,
  color = "#3c50e0",
  height = 280,
}: AnalyticsBarChartProps) {
  const safeCategories = useMemo(
    () => categories.filter((item) => typeof item === "string" && item.length > 0),
    [categories],
  );
  const safeValues = useMemo(
    () => values.map((value) => (Number.isFinite(value) ? value : 0)),
    [values],
  );
  const hasData = safeCategories.length > 0 && safeValues.length > 0;
  const maxValue = Math.max(...safeValues, 1);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        style={{ minHeight: height }}
      >
        No chart data
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ minHeight: height }}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h4>
      )}
      <div className="space-y-3">
        {safeCategories.map((label, index) => {
          const value = safeValues[index] ?? 0;
          const width = Math.max(4, Math.round((value / maxValue) * 100));
          return (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {value.toLocaleString()}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
