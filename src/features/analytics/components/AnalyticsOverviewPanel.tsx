"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import type { AnalyticsOverview } from "@/features/analytics/types/analytics";

type AnalyticsOverviewPanelProps = {
  data?: AnalyticsOverview;
  isLoading?: boolean;
  isError?: boolean;
};

export function AnalyticsOverviewPanel({
  data,
  isLoading,
  isError,
}: AnalyticsOverviewPanelProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Overview analytics unavailable</AlertTitle>
        <AlertDescription>Failed to load overview metrics.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCard key={i} title="Loading" value="-" loading />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  const overview = data.overview;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Centers" value={overview.total_centers} />
        <StatsCard title="Active Centers" value={overview.active_centers} />
        <StatsCard title="Total Courses" value={overview.total_courses} />
        <StatsCard
          title="Daily Active Learners"
          value={overview.daily_active_learners}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Centers by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Unbranded", "Branded"]}
              values={[
                overview.centers_by_type.unbranded,
                overview.centers_by_type.branded,
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses & Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              categories={[
                "Published Courses",
                "Total Enrollments",
                "Active Enrollments",
              ]}
              values={[
                overview.published_courses,
                overview.total_enrollments,
                overview.active_enrollments,
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
