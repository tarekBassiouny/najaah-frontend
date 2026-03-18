"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import { AnalyticsHorizontalBarChart } from "./charts/AnalyticsHorizontalBarChart";
import { AnalyticsAreaChart } from "./charts/AnalyticsAreaChart";
import { AnalyticsStackedAreaChart } from "./charts/AnalyticsStackedAreaChart";
import type { AnalyticsLearnersEnrollments } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

type AnalyticsLearnersEnrollmentsPanelProps = {
  data?: AnalyticsLearnersEnrollments;
  isLoading?: boolean;
  isError?: boolean;
};

const ENROLLMENT_STATUS_SERIES = [
  { key: "active", label: "Active", color: "#13c296" },
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "cancelled", label: "Cancelled", color: "#ef4444" },
];

export function AnalyticsLearnersEnrollmentsPanel({
  data,
  isLoading,
  isError,
}: AnalyticsLearnersEnrollmentsPanelProps) {
  const { t } = useTranslation();

  /* Phase 3 — trend data */
  const registrationTrendData = useMemo(
    () =>
      data?.learners.trends?.registrations_over_time?.map((p) => ({
        date: p.date,
        value: p.count,
      })) ?? [],
    [data?.learners.trends?.registrations_over_time],
  );

  const enrollmentTrendData = useMemo(
    () => data?.enrollments.trends?.over_time ?? [],
    [data?.enrollments.trends?.over_time],
  );

  const hasTrends =
    registrationTrendData.length > 0 || enrollmentTrendData.length > 0;

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
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

  const { learners, enrollments } = data;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s3",
          )}
          value={learners.total_students}
          variant="info"
          animationDelay={0}
          icon={
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
          }
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s4",
          )}
          value={learners.active_students}
          variant="success"
          animationDelay={80}
          icon={
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
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticslearnersenrollmentspanel.s5",
          )}
          value={learners.new_students}
          variant="warning"
          animationDelay={160}
          icon={
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
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment Status — Donut */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticslearnersenrollmentspanel.s6",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Active", "Pending", "Deactivated", "Cancelled"]}
              values={[
                enrollments.by_status.active,
                enrollments.by_status.pending,
                enrollments.by_status.deactivated,
                enrollments.by_status.cancelled,
              ]}
              colors={["#13c296", "#f59e0b", "#94a3b8", "#ef4444"]}
            />
          </CardContent>
        </Card>

        {/* Top Courses by Enrollment */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticslearnersenrollmentspanel.s7",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsHorizontalBarChart
              items={enrollments.top_courses.slice(0, 8).map((row) => ({
                label: row.title ?? `Course #${row.course_id}`,
                value: row.enrollments,
              }))}
              color="#3c50e0"
              emptyMessage={t(
                "auto.features.analytics.components.analyticslearnersenrollmentspanel.s8",
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Phase 3 — Trend charts (only rendered when backend provides data) */}
      {hasTrends && (
        <div className="grid gap-6 lg:grid-cols-2">
          {registrationTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticslearnersenrollmentspanel.newRegistrations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsAreaChart
                  data={registrationTrendData}
                  color="#0ea5e9"
                />
              </CardContent>
            </Card>
          )}

          {enrollmentTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticslearnersenrollmentspanel.enrollmentStatusOverTime")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsStackedAreaChart
                  data={enrollmentTrendData}
                  series={ENROLLMENT_STATUS_SERIES}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Learners by Center — only show if data exists */}
      {learners.by_center.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("auto.features.analytics.components.analyticslearnersenrollmentspanel.learnersByCenter")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsHorizontalBarChart
              items={learners.by_center.slice(0, 8).map((row) => ({
                label:
                  row.center_id != null
                    ? `Center ${row.center_id}`
                    : "Najaah App",
                value: row.students,
              }))}
              color="#f59e0b"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
