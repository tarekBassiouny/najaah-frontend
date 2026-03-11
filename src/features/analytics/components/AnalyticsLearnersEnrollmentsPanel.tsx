"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import type { AnalyticsLearnersEnrollments } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s1",
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s2",
          )}
        </AlertDescription>
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
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s3",
          )}
          value={learners.total_students}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s4",
          )}
          value={learners.active_students}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s5",
          )}
          value={learners.new_students}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticslearnersenrollmentspanel.s6",
              )}
            </CardTitle>
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
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticslearnersenrollmentspanel.s7",
              )}
            </CardTitle>
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
                {t(
                  "auto.features.analytics.components.analyticslearnersenrollmentspanel.s8",
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
