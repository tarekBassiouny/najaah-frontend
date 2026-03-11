"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsBarChart } from "./charts/AnalyticsBarChart";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import type { AnalyticsOverview } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t("auto.features.analytics.components.analyticsoverviewpanel.s1")}
        </AlertTitle>
        <AlertDescription>
          {t("auto.features.analytics.components.analyticsoverviewpanel.s2")}
        </AlertDescription>
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
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s3",
          )}
          value={overview.total_centers}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s4",
          )}
          value={overview.active_centers}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s5",
          )}
          value={overview.total_courses}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s6",
          )}
          value={overview.daily_active_learners}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsoverviewpanel.s7",
              )}
            </CardTitle>
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
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsoverviewpanel.s8",
              )}
            </CardTitle>
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
