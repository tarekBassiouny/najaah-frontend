"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/ui/stats-card";
import { AnalyticsDonutChart } from "./charts/AnalyticsDonutChart";
import { AnalyticsProgressGauge } from "./charts/AnalyticsProgressGauge";
import { AnalyticsAreaChart } from "./charts/AnalyticsAreaChart";
import { AnalyticsStackedAreaChart } from "./charts/AnalyticsStackedAreaChart";
import type { AnalyticsDevicesRequests } from "@/features/analytics/types/analytics";
import { useTranslation } from "@/features/localization";

type AnalyticsDevicesRequestsPanelProps = {
  data?: AnalyticsDevicesRequests;
  isLoading?: boolean;
  isError?: boolean;
};

const EXTRA_VIEWS_SERIES = [
  { key: "approved", label: "Approved", color: "#13c296" },
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

export function AnalyticsDevicesRequestsPanel({
  data,
  isLoading,
  isError,
}: AnalyticsDevicesRequestsPanelProps) {
  const { t } = useTranslation();

  /* Phase 4 — trend data */
  const deviceTrendData = useMemo(
    () =>
      data?.devices.trends?.registrations_over_time?.map((p) => ({
        date: p.date,
        value: p.count,
      })) ?? [],
    [data?.devices.trends?.registrations_over_time],
  );

  const extraViewsTrendData = useMemo(
    () => data?.requests.extra_views.trends?.over_time ?? [],
    [data?.requests.extra_views.trends?.over_time],
  );

  const hasTrends =
    deviceTrendData.length > 0 || extraViewsTrendData.length > 0;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s1",
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s2",
          )}
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

  const { devices, requests } = data;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s3",
          )}
          value={devices.total}
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
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
          }
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s4",
          )}
          value={devices.active}
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
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s5",
          )}
          value={devices.revoked}
          variant="danger"
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          }
        />
        <StatsCard
          title={t(
            "auto.features.analytics.components.analyticsdevicesrequestspanel.s6",
          )}
          value={devices.pending}
          variant="warning"
          animationDelay={240}
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
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device Changes — Donut */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s7",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Pending", "Approved", "Rejected", "Pre-approved"]}
              values={[
                devices.changes.pending,
                devices.changes.approved,
                devices.changes.rejected,
                devices.changes.pre_approved,
              ]}
              colors={["#f59e0b", "#13c296", "#ef4444", "#0ea5e9"]}
            />
          </CardContent>
        </Card>

        {/* Device Source — Donut */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s8",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Mobile", "OTP", "Admin"]}
              values={[
                devices.changes.by_source.mobile,
                devices.changes.by_source.otp,
                devices.changes.by_source.admin,
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Extra Views — Progress Gauge + Stats */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s9",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <AnalyticsProgressGauge
                value={Math.round(requests.extra_views.approval_rate * 100)}
                label={t("auto.features.analytics.components.analyticsdevicesrequestspanel.approvalRate")}
                color="#13c296"
                height={160}
              />
              <div className="flex flex-col justify-center gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {t("auto.features.analytics.components.analyticsdevicesrequestspanel.avgDecision")}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {requests.extra_views.avg_decision_hours.toFixed(1)}h
                  </p>
                </div>
                <AnalyticsDonutChart
                  labels={["Pending", "Approved", "Rejected"]}
                  values={[
                    requests.extra_views.pending,
                    requests.extra_views.approved,
                    requests.extra_views.rejected,
                  ]}
                  colors={["#f59e0b", "#13c296", "#ef4444"]}
                  height={140}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Requests — Donut */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t(
                "auto.features.analytics.components.analyticsdevicesrequestspanel.s12",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsDonutChart
              labels={["Pending", "Approved", "Rejected"]}
              values={[
                requests.enrollment.pending,
                requests.enrollment.approved,
                requests.enrollment.rejected,
              ]}
              colors={["#f59e0b", "#13c296", "#ef4444"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Phase 4 — Trend charts (only rendered when backend provides data) */}
      {hasTrends && (
        <div className="grid gap-6 lg:grid-cols-2">
          {deviceTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticsdevicesrequestspanel.deviceRegistrations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsAreaChart data={deviceTrendData} color="#3c50e0" />
              </CardContent>
            </Card>
          )}

          {extraViewsTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.features.analytics.components.analyticsdevicesrequestspanel.extraViewsOverTime")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsStackedAreaChart
                  data={extraViewsTrendData}
                  series={EXTRA_VIEWS_SERIES}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
