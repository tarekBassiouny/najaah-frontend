"use client";

import { useMemo } from "react";

type AnalyticsDonutChartProps = {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
};

/**
 * CSS-based donut/pie chart visualization.
 * ApexCharts is disabled due to React 19 compatibility issues.
 * See: https://github.com/apexcharts/react-apexcharts/issues/475
 */
export function AnalyticsDonutChart({
  labels,
  values,
  colors = ["#3c50e0", "#13c296", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  height = 280,
}: AnalyticsDonutChartProps) {
  const safeValues = useMemo(
    () => values.map((value) => (Number.isFinite(value) ? value : 0)),
    [values],
  );
  const total = safeValues.reduce((sum, value) => sum + value, 0);
  const hasData = labels.length > 0 && safeValues.length > 0 && total > 0;

  // Calculate segments for the CSS conic-gradient donut
  const segments = useMemo(() => {
    if (!hasData) return [];
    let currentAngle = 0;
    return safeValues.map((value, index) => {
      const percent = (value / total) * 100;
      const startAngle = currentAngle;
      currentAngle += percent;
      return {
        label: labels[index],
        value,
        percent,
        startAngle,
        endAngle: currentAngle,
        color: colors[index % colors.length],
      };
    });
  }, [safeValues, total, labels, colors, hasData]);

  // Build conic-gradient string
  const gradientString = useMemo(() => {
    if (segments.length === 0) return "transparent";
    return segments
      .map((seg) => `${seg.color} ${seg.startAngle}% ${seg.endAngle}%`)
      .join(", ");
  }, [segments]);

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
    <div
      className="flex flex-col items-center gap-6"
      style={{ minHeight: height }}
    >
      {/* Donut Chart */}
      <div className="relative">
        <div
          className="rounded-full"
          style={{
            width: 180,
            height: 180,
            background: `conic-gradient(${gradientString})`,
          }}
        />
        {/* Center hole */}
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white dark:bg-gray-900"
          style={{ width: 100, height: 100 }}
        >
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {seg.label}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {seg.value.toLocaleString()} ({Math.round(seg.percent)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
