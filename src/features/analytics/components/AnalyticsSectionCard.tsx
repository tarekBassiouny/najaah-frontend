"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type AnalyticsSectionCardProps = {
  title: string;
  data: Record<string, unknown> | null | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function prettifyKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatValue(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function AnalyticsSectionCard({
  title,
  data,
  isLoading,
  isError,
  onRetry,
}: AnalyticsSectionCardProps) {
  const entries = data ? Object.entries(data).slice(0, 8) : [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {isError && onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Failed to load section</AlertTitle>
            <AlertDescription>Please retry this analytics request.</AlertDescription>
          </Alert>
        ) : entries.length ? (
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-800"
              >
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {prettifyKey(key)}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No analytics data for the selected range.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
