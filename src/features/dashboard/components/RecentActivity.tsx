"use client";

import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardActivity } from "@/features/dashboard/types/dashboard";

type RecentActivityProps = {
  activities?: DashboardActivity[];
  isLoading?: boolean;
};

type ActivityKind = "enrollment" | "extra_view" | "device_change" | "other";

function toTitleCase(value: string) {
  return value
    .replace(/[_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActivityKind(action?: string | null): ActivityKind {
  const normalized = String(action ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "enrollment.created") {
    return "enrollment";
  }

  if (normalized === "extra_view.granted") {
    return "extra_view";
  }

  if (normalized === "device_change_request.approved") {
    return "device_change";
  }

  return "other";
}

function getRelativeTime(activity: DashboardActivity) {
  if (activity.created_at) {
    try {
      return formatDistanceToNow(new Date(activity.created_at), {
        addSuffix: true,
      });
    } catch {
      // Fallback below
    }
  }

  if (typeof activity.days_ago === "number") {
    if (activity.days_ago === 0) return "today";
    if (activity.days_ago === 1) return "1 day ago";
    return `${activity.days_ago} days ago`;
  }

  return "Unknown time";
}

const activityIcons: Record<ActivityKind, React.ReactNode> = {
  enrollment: (
    <svg
      className="h-4 w-4 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  extra_view: (
    <svg
      className="h-4 w-4 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  device_change: (
    <svg
      className="h-4 w-4 text-orange-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  other: (
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z"
      />
    </svg>
  ),
};

const badgeVariants: Record<
  ActivityKind,
  "info" | "success" | "warning" | "secondary"
> = {
  enrollment: "success",
  extra_view: "info",
  device_change: "warning",
  other: "secondary",
};

export function RecentActivity({ activities = [], isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No recent activity"
            description="Activity will appear here once actions are taken."
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const kind = getActivityKind(activity.action);
            const actorName = activity.actor?.name ?? "System";

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  {activityIcons[kind]}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeVariants[kind]} className="text-xs">
                      {toTitleCase(activity.action)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getRelativeTime(activity)} by {actorName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
