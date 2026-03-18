"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SeriesConfig = {
  key: string;
  label: string;
  color: string;
};

type AnalyticsStackedAreaChartProps = {
  data: Array<Record<string, string | number>>;
  series: SeriesConfig[];
  height?: number;
};

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
  label,
  series,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
  series: SeriesConfig[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label ? formatDate(label) : ""}
      </p>
      {payload.map((entry) => {
        const config = series.find((s) => s.key === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {config?.label ?? entry.dataKey}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {entry.value.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Recharts-based stacked area chart for multi-series time-series data.
 * Renders nothing when data is empty.
 */
export function AnalyticsStackedAreaChart({
  data,
  series,
  height = 240,
}: AnalyticsStackedAreaChartProps) {
  if (!data || data.length === 0 || series.length === 0) {
    return null;
  }

  const maxLabelCount = data.length > 14 ? 6 : data.length > 7 ? 4 : undefined;

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`stacked-grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--chart-grid, #e5e7eb)"
          strokeOpacity={0.6}
        />
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
        <Tooltip content={<CustomTooltip series={series} />} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stackId="1"
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#stacked-grad-${s.key})`}
            animationDuration={800}
            animationEasing="ease-out"
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
