"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "@/features/localization";

type AnalyticsBarChartProps = {
  title?: string;
  categories: string[];
  values: number[];
  color?: string;
  colors?: string[];
  height?: number;
};

const DEFAULT_PALETTE = [
  "#3c50e0",
  "#13c296",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
];

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { name: string; value: number; fill: string };
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
        {item.value.toLocaleString()}
      </p>
    </div>
  );
}

/**
 * Recharts-based vertical bar chart with tooltips and animations.
 */
export function AnalyticsBarChart({
  title,
  categories,
  values,
  color,
  colors,
  height = 280,
}: AnalyticsBarChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    return categories
      .filter((cat) => typeof cat === "string" && cat.length > 0)
      .map((name, index) => {
        const value = Number.isFinite(values[index]) ? values[index] : 0;
        let fill: string;
        if (colors && colors.length > 0) {
          fill = colors[index % colors.length];
        } else if (color) {
          fill = color;
        } else {
          fill = DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
        }
        return { name, value, fill };
      });
  }, [categories, values, color, colors]);

  const hasData = chartData.length > 0;
  const allZero = chartData.every((d) => d.value === 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        style={{ minHeight: height }}
      >
        {t("auto.features.analytics.components.charts.analyticsbarchart.s1")}
      </div>
    );
  }

  if (allZero) {
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
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {t(
            "auto.features.analytics.components.charts.analyticsbarchart.noDataForPeriod",
          )}
        </span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: height }}>
      {title && (
        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--chart-grid, #e5e7eb)"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            interval={0}
            tickFormatter={(val: string) =>
              val.length > 12 ? `${val.slice(0, 11)}…` : val
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={formatAxisValue}
            width={42}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
