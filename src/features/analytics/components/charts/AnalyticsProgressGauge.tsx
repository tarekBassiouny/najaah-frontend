"use client";

import { useMemo } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

type AnalyticsProgressGaugeProps = {
  value: number;
  label?: string;
  color?: string;
  height?: number;
  suffix?: string;
};

const DEFAULT_COLOR = "#3c50e0";

/**
 * Recharts-based radial progress gauge for displaying percentages/rates.
 * Uses explicit pixel dimensions — no ResponsiveContainer needed.
 */
export function AnalyticsProgressGauge({
  value,
  label,
  color = DEFAULT_COLOR,
  height = 200,
  suffix = "%",
}: AnalyticsProgressGaugeProps) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const displayValue =
    safeValue >= 1 ? Math.round(safeValue) : safeValue.toFixed(1);

  const chartData = useMemo(
    () => [{ name: label ?? "Value", value: safeValue, fill: color }],
    [safeValue, color, label],
  );

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: height }}
    >
      <div className="relative" style={{ width: height, height: height }}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          data={chartData}
          barSize={12}
          width={height}
          height={height}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            animationDuration={800}
            animationEasing="ease-out"
            background={{ fill: "var(--gauge-bg, #f3f4f6)" }}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayValue}
            {suffix}
          </span>
          {label && (
            <span className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
