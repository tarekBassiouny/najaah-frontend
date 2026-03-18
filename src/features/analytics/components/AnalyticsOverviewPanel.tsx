"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import { AnalyticsAreaChart } from "./charts/AnalyticsAreaChart";
import { computeTrend } from "@/features/analytics/utils/trend";
import type { AnalyticsOverview } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

type AnalyticsOverviewPanelProps = {
  data?: AnalyticsOverview;
  isLoading?: boolean;
  isError?: boolean;
};

function BuildingIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

export function AnalyticsOverviewPanel({
  data,
  isLoading,
  isError,
}: AnalyticsOverviewPanelProps) {
  const { t } = useTranslation();

  /* Phase 1 — map trend data for AreaChart */
  const enrollmentTrendData = useMemo(
    () =>
      data?.trends?.enrollments_over_time?.map((p) => ({
        date: p.date,
        value: p.count,
      })) ?? [],
    [data?.trends?.enrollments_over_time],
  );

  const learnerTrendData = useMemo(
    () =>
      data?.trends?.active_learners_over_time?.map((p) => ({
        date: p.date,
        value: p.count,
      })) ?? [],
    [data?.trends?.active_learners_over_time],
  );

  const coursesTrendData = useMemo(
    () =>
      data?.trends?.courses_created_over_time?.map((p) => ({
        date: p.date,
        value: p.count,
      })) ?? [],
    [data?.trends?.courses_created_over_time],
  );

  const hasTrends =
    enrollmentTrendData.length > 0 ||
    learnerTrendData.length > 0 ||
    coursesTrendData.length > 0;

  /* Phase 2 — period comparison */
  const prev = data?.previous_period;

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
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const overview = data.overview;
  const unpublishedCourses =
    overview.total_courses - overview.published_courses;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s3",
          )}
          value={overview.total_centers}
          variant="info"
          icon={<BuildingIcon />}
          animationDelay={0}
          trend={computeTrend(overview.total_centers, prev?.total_centers)}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s4",
          )}
          value={overview.active_centers}
          variant="success"
          icon={<CheckBadgeIcon />}
          animationDelay={80}
          trend={computeTrend(overview.active_centers, prev?.active_centers)}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s5",
          )}
          value={overview.total_courses}
          variant="info"
          icon={<BookIcon />}
          animationDelay={160}
          trend={computeTrend(overview.total_courses, prev?.total_courses)}
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsoverviewpanel.s6",
          )}
          value={overview.daily_active_learners}
          variant="success"
          icon={<UsersIcon />}
          animationDelay={240}
          trend={computeTrend(
            overview.daily_active_learners,
            prev?.daily_active_learners,
          )}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Centers breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsoverviewpanel.s7",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Branded
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {overview.centers_by_type.branded}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Unbranded
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {overview.centers_by_type.unbranded}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{
                      width:
                        overview.total_centers > 0
                          ? `${(overview.centers_by_type.branded / overview.total_centers) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {overview.total_centers > 0
                  ? `${Math.round((overview.centers_by_type.branded / overview.total_centers) * 100)}% branded`
                  : "No centers"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Course distribution — donut */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsoverviewpanel.s8",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Published", "Unpublished"]}
              values={[overview.published_courses, unpublishedCourses]}
              colors={["#3c50e0", "#94a3b8"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Phase 1 — Trend lines (only rendered when backend provides data) */}
      {hasTrends && (
        <div className="grid gap-6 lg:grid-cols-2">
          {enrollmentTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticsoverviewpanel.enrollmentTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsAreaChart
                  data={enrollmentTrendData}
                  color="#3c50e0"
                />
              </CardContent>
            </Card>
          )}

          {learnerTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticsoverviewpanel.activeLearnersTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsAreaChart data={learnerTrendData} color="#13c296" />
              </CardContent>
            </Card>
          )}

          {coursesTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticsoverviewpanel.coursesCreated")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsAreaChart data={coursesTrendData} color="#0ea5e9" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
