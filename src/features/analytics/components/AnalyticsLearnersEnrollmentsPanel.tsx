"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import type { AnalyticsLearnersEnrollments } from "@/features/analytics/types/analytics";

type AnalyticsLearnersEnrollmentsPanelProps = {
  data?: AnalyticsLearnersEnrollments;
  isLoading?: boolean;
  isError?: boolean;
};

export function AnalyticsLearnersEnrollmentsPanel({
  data,
  isLoading,
  isError,
}: AnalyticsLearnersEnrollmentsPanelProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Learners & enrollments analytics unavailable</AlertTitle>
        <AlertDescription>Failed to load learner metrics.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-80 w-full" />;
  }

  const { learners, enrollments } = data;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total Students" value={learners.total_students} />
        <StatsCard title="Active Students" value={learners.active_students} />
        <StatsCard title="New Students" value={learners.new_students} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enrollments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart
              categories={["Active", "Pending", "Deactivated", "Cancelled"]}
              values={[
                enrollments.by_status.active,
                enrollments.by_status.pending,
                enrollments.by_status.deactivated,
                enrollments.by_status.cancelled,
              ]}
              color="#0ea5e9"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Students by Center</CardTitle>
          </CardHeader>
          <CardContent>
            {learners.by_center.length ? (
              <AnalyticsBarChart
                categories={learners.by_center
                  .slice(0, 8)
                  .map((row) =>
                    row.center_id != null
                      ? `Center ${row.center_id}`
                      : "Najaah App",
                  )}
                values={learners.by_center
                  .slice(0, 8)
                  .map((row) => row.students)}
                color="#f59e0b"
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Center breakdown is only available for platform-level analytics.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
