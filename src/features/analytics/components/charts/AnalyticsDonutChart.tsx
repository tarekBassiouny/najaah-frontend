"use client";

import { useMemo, useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "@/features/localization";

type AnalyticsDonutChartProps = {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
};

const DEFAULT_COLORS = [
  "#3c50e0",
  "#13c296",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function formatTotal(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { name: string; value: number; fill: string; percent: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {item.name}
      </p>
      <p className="text-base font-bold" style={{ color: item.fill }}>
        {item.value.toLocaleString()}{" "}
        <span className="text-xs font-normal text-gray-400">
          ({Math.round(item.percent)}%)
        </span>
      </p>
    </div>
  );
}

function CenterTotal({ total, size }: { total: number; size: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="text-lg font-semibold text-gray-900 dark:text-white">
        {formatTotal(total)}
      </span>
      <span className="text-[11px] text-gray-400 dark:text-gray-500">
        Total
      </span>
    </div>
  );
}

/**
 * Recharts-based donut chart with hover effects and legend.
 */
export function AnalyticsDonutChart({
  labels,
  values,
  colors = DEFAULT_COLORS,
  height = 280,
}: AnalyticsDonutChartProps) {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeValues = useMemo(
    () => values.map((v) => (Number.isFinite(v) ? v : 0)),
    [values],
  );
  const total = safeValues.reduce((sum, v) => sum + v, 0);
  const hasData = labels.length > 0 && safeValues.length > 0 && total > 0;

  const chartData = useMemo(() => {
    if (!hasData) return [];
    return safeValues.map((value, index) => ({
      name: labels[index],
      value,
      fill: colors[index % colors.length],
      percent: (value / total) * 100,
    }));
  }, [safeValues, labels, colors, total, hasData]);

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => setHoveredIndex(index),
    [],
  );
  const handleMouseLeave = useCallback(() => setHoveredIndex(null), []);

  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700"
        style={{ minHeight: height }}
      >
        <svg
          className="h-10 w-10 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
          />
        </svg>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {t(
            "auto.features.analytics.components.charts.analyticsdonutchart.s1",
          )}
        </span>
      </div>
    );
  }

  const chartHeight = Math.min(220, height - 60);

  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{ minHeight: height }}
    >
      <div
        className="relative mx-auto"
        style={{ width: chartHeight, height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height={chartHeight} minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              animationDuration={800}
              animationEasing="ease-out"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              label={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="none"
                  opacity={
                    hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1
                  }
                  style={{ transition: "opacity 0.2s" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <CenterTotal total={total} size={chartHeight} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5">
        {chartData.map((seg, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={seg.name}
              className="flex cursor-pointer items-center gap-2 text-sm transition-opacity"
              style={{
                opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className="h-2.5 w-2.5 rounded-full transition-transform"
                style={{
                  backgroundColor: seg.fill,
                  transform: isHovered ? "scale(1.4)" : "scale(1)",
                }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {seg.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {seg.value.toLocaleString()}{" "}
                <span className="text-gray-400 dark:text-gray-500">
                  ({Math.round(seg.percent)}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
