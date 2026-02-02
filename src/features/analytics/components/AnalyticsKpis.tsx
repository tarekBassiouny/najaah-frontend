"use client";

import { StatsCard } from "@/components/ui/stats-card";

type AnalyticsKpisProps = {
  data: Record<string, unknown> | null | undefined;
  isLoading?: boolean;
};

function prettifyKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function getNumericMetrics(data: Record<string, unknown> | null | undefined) {
  if (!data) return [];
  return Object.entries(data)
    .filter(([, value]) => typeof value === "number")
    .slice(0, 4);
}

export function AnalyticsKpis({ data, isLoading }: AnalyticsKpisProps) {
  const metrics = getNumericMetrics(data);

  if (!metrics.length && !isLoading) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {(isLoading ? Array.from({ length: 4 }) : metrics).map((item, index) => {
        const [key, value] = Array.isArray(item)
          ? item
          : [`metric_${index + 1}`, 0];
        return (
          <StatsCard
            key={key}
            title={prettifyKey(key)}
            value={typeof value === "number" ? value.toLocaleString() : "—"}
            loading={isLoading}
          />
        );
      })}
    </div>
  );
}
