"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type HorizontalBarItem = {
  label: string;
  value: number;
  sublabel?: string;
};

type AnalyticsHorizontalBarChartProps = {
  items: HorizontalBarItem[];
  color?: string;
  maxItems?: number;
  emptyMessage?: string;
};

const DEFAULT_COLOR = "#3c50e0";

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
    payload: { name: string; value: number; fill: string; rank: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        #{item.rank} {item.name}
      </p>
      <p className="text-base font-bold" style={{ color: item.fill }}>
        {item.value.toLocaleString()}
      </p>
    </div>
  );
}

export function AnalyticsHorizontalBarChart({
  items,
  color = DEFAULT_COLOR,
  maxItems = 8,
  emptyMessage = "No data available",
}: AnalyticsHorizontalBarChartProps) {
  const chartData = useMemo(() => {
    return items.slice(0, maxItems).map((item, index) => ({
      name: item.label.length > 20 ? `${item.label.slice(0, 19)}…` : item.label,
      fullName: item.label,
      value: Number.isFinite(item.value) ? item.value : 0,
      fill: color,
      rank: index + 1,
    }));
  }, [items, maxItems, color]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-10 dark:border-gray-700">
        <svg
          className="h-8 w-8 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
          />
        </svg>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {emptyMessage}
        </span>
      </div>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 40 + 20);

  return (
    <ResponsiveContainer width="100%" height={chartHeight} minWidth={0}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        barCategoryGap="25%"
      >
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={formatAxisValue}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          width={140}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar
          dataKey="value"
          radius={[0, 6, 6, 0]}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.fill}
              opacity={1 - index * 0.06}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
