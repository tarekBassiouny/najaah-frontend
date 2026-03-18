"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTenant } from "@/app/tenant-provider";
import { setTenantState } from "@/lib/tenant-store";
import { useTranslation } from "@/features/localization";
import { AnalyticsFiltersBar } from "@/features/analytics/components/AnalyticsFiltersBar";
import { AnalyticsSectionHeader } from "@/features/analytics/components/AnalyticsSectionHeader";
import { AnalyticsOverviewPanel } from "@/features/analytics/components/AnalyticsOverviewPanel";
import { AnalyticsCoursesMediaPanel } from "@/features/analytics/components/AnalyticsCoursesMediaPanel";
import { AnalyticsLearnersEnrollmentsPanel } from "@/features/analytics/components/AnalyticsLearnersEnrollmentsPanel";
import { AnalyticsDevicesRequestsPanel } from "@/features/analytics/components/AnalyticsDevicesRequestsPanel";
import {
  useAnalyticsCoursesMedia,
  useAnalyticsDevicesRequests,
  useAnalyticsLearnersEnrollments,
  useAnalyticsOverview,
} from "@/features/analytics/hooks/use-analytics";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 29);

  return {
    from: toDateInput(from),
    to: toDateInput(to),
  };
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const tenant = useTenant();
  const isPlatformAdmin = !tenant.centerSlug;
  const [sessionDefaultRange] = useState(() => getDefaultDateRange());

  const [from, setFrom] = useState(sessionDefaultRange.from);
  const [to, setTo] = useState(sessionDefaultRange.to);

  const analyticsContext = useMemo(
    () => ({ centerId: tenant.centerId ?? null }),
    [tenant.centerId],
  );
  const filters = useMemo(
    () => ({
      center_id: tenant.centerId ?? undefined,
      from,
      to,
    }),
    [tenant.centerId, from, to],
  );

  const overviewQuery = useAnalyticsOverview(filters, analyticsContext);
  const coursesMediaQuery = useAnalyticsCoursesMedia(filters, analyticsContext);
  const learnersQuery = useAnalyticsLearnersEnrollments(
    filters,
    analyticsContext,
  );
  const devicesQuery = useAnalyticsDevicesRequests(filters, analyticsContext);

  const isLoadingAny =
    overviewQuery.isFetching ||
    coursesMediaQuery.isFetching ||
    learnersQuery.isFetching ||
    devicesQuery.isFetching;

  const resetFilters = () => {
    setFrom(sessionDefaultRange.from);
    setTo(sessionDefaultRange.to);
    if (isPlatformAdmin) {
      setTenantState({ centerId: null, centerName: null });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("pages.analytics.title")}
        description={t("pages.analytics.dashboardDescription")}
      />

      <AnalyticsFiltersBar
        isPlatformAdmin={isPlatformAdmin}
        defaultFrom={sessionDefaultRange.from}
        defaultTo={sessionDefaultRange.to}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onReset={resetFilters}
        isLoading={isLoadingAny}
      />

      <AnalyticsSectionHeader title={t("pages.analytics.sectionOverview")} />
      <AnalyticsOverviewPanel
        data={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
      />

      <AnalyticsSectionHeader
        title={t("pages.analytics.sectionCoursesMedia")}
      />
      <AnalyticsCoursesMediaPanel
        data={coursesMediaQuery.data}
        isLoading={coursesMediaQuery.isLoading}
        isError={coursesMediaQuery.isError}
      />

      <AnalyticsSectionHeader
        title={t("pages.analytics.sectionLearnersEnrollments")}
      />
      <AnalyticsLearnersEnrollmentsPanel
        data={learnersQuery.data}
        isLoading={learnersQuery.isLoading}
        isError={learnersQuery.isError}
      />

      <AnalyticsSectionHeader
        title={t("pages.analytics.sectionDevicesRequests")}
      />
      <AnalyticsDevicesRequestsPanel
        data={devicesQuery.data}
        isLoading={devicesQuery.isLoading}
        isError={devicesQuery.isError}
      />
    </div>
  );
}
