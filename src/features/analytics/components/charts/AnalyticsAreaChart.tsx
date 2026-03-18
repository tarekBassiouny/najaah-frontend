"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AnalyticsAreaChartProps = {
  data: Array<{ date: string; value: number }>;
  color?: string;
  height?: number;
  showGrid?: boolean;
  gradientOpacity?: number;
};

const DEFAULT_COLOR = "#3c50e0";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function CustomTooltip({
  active,
  payload,
  color,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { date: string; value: number };
  }>;
  color: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {formatDate(item.date)}
      </p>
      <p className="text-base font-bold" style={{ color }}>
        {item.value.toLocaleString()}
      </p>
    </div>
  );
}

/**
 * Recharts-based area chart for time-series trend data.
 * Renders gracefully with empty data (shows nothing).
 */
export function AnalyticsAreaChart({
  data,
  color = DEFAULT_COLOR,
  height = 240,
  showGrid = true,
  gradientOpacity = 0.15,
}: AnalyticsAreaChartProps) {
  const gradientId = useMemo(
    () => `area-gradient-${color.replace("#", "")}`,
    [color],
  );

  if (!data || data.length === 0) {
    return null;
  }

  const maxLabelCount = data.length > 14 ? 6 : data.length > 7 ? 4 : undefined;

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={gradientOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--chart-grid, #e5e7eb)"
            strokeOpacity={0.6}
          />
        )}
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={formatDate}
          interval={maxLabelCount ? Math.floor(data.length / maxLabelCount) : 0}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={formatAxisValue}
          width={42}
        />
        <Tooltip content={<CustomTooltip color={color} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={800}
          animationEasing="ease-out"
          dot={false}
          activeDot={{
            r: 5,
            strokeWidth: 2,
            stroke: color,
            fill: "white",
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
