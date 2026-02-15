"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTenant } from "@/app/tenant-provider";
import { setTenantState } from "@/lib/tenant-store";
import { AnalyticsFiltersBar } from "@/features/analytics/components/AnalyticsFiltersBar";
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
  const tenant = useTenant();
  const isPlatformAdmin = !tenant.centerSlug;
  const defaultRange = getDefaultDateRange();

  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [timezone, setTimezone] = useState("UTC");

  const filters = useMemo(
    () => ({
      center_id: tenant.centerId ?? undefined,
      from,
      to,
      timezone,
    }),
    [tenant.centerId, from, to, timezone],
  );

  const overviewQuery = useAnalyticsOverview(filters);
  const coursesMediaQuery = useAnalyticsCoursesMedia(filters);
  const learnersQuery = useAnalyticsLearnersEnrollments(filters);
  const devicesQuery = useAnalyticsDevicesRequests(filters);

  const isLoadingAny =
    overviewQuery.isFetching ||
    coursesMediaQuery.isFetching ||
    learnersQuery.isFetching ||
    devicesQuery.isFetching;

  const resetFilters = () => {
    const nextRange = getDefaultDateRange();
    setFrom(nextRange.from);
    setTo(nextRange.to);
    setTimezone("UTC");
    if (isPlatformAdmin) {
      setTenantState({ centerId: null, centerName: null });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track performance across courses, learners, devices, and media."
      />

      <AnalyticsFiltersBar
        isPlatformAdmin={isPlatformAdmin}
        from={from}
        to={to}
        timezone={timezone}
        onFromChange={setFrom}
        onToChange={setTo}
        onTimezoneChange={setTimezone}
        onReset={resetFilters}
        isLoading={isLoadingAny}
      />

      <AnalyticsOverviewPanel
        data={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
      />

      <AnalyticsCoursesMediaPanel
        data={coursesMediaQuery.data}
        isLoading={coursesMediaQuery.isLoading}
        isError={coursesMediaQuery.isError}
      />

      <AnalyticsLearnersEnrollmentsPanel
        data={learnersQuery.data}
        isLoading={learnersQuery.isLoading}
        isError={learnersQuery.isError}
      />

      <AnalyticsDevicesRequestsPanel
        data={devicesQuery.data}
        isLoading={devicesQuery.isLoading}
        isError={devicesQuery.isError}
      />
    </div>
  );
}
