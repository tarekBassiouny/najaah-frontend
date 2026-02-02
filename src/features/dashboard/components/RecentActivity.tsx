"use client";

import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type Activity = {
  id: number;
  type: "enrollment" | "course" | "device" | "video";
  action: string;
  subject: string;
  timestamp: string;
  actor?: string;
};

type RecentActivityProps = {
  activities?: Activity[];
  isLoading?: boolean;
};

const activityIcons: Record<Activity["type"], React.ReactNode> = {
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
  course: (
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
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  device: (
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
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  video: (
    <svg
      className="h-4 w-4 text-purple-500"
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
};

const badgeVariants: Record<
  Activity["type"],
  "info" | "success" | "warning" | "secondary"
> = {
  enrollment: "success",
  course: "info",
  device: "warning",
  video: "secondary",
};

// Mock data for demonstration
const mockActivities: Activity[] = [
  {
    id: 1,
    type: "enrollment",
    action: "New enrollment",
    subject: "John Doe enrolled in React Fundamentals",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor: "System",
  },
  {
    id: 2,
    type: "course",
    action: "Course published",
    subject: "Advanced TypeScript was published",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actor: "Admin",
  },
  {
    id: 3,
    type: "device",
    action: "Device approved",
    subject: "Device change for user@email.com approved",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: "Admin",
  },
  {
    id: 4,
    type: "video",
    action: "Video uploaded",
    subject: "Introduction.mp4 finished processing",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: "System",
  },
];

export function RecentActivity({
  activities = mockActivities,
  isLoading,
}: RecentActivityProps) {
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
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                {activityIcons[activity.type]}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={badgeVariants[activity.type]}
                    className="text-xs"
                  >
                    {activity.action}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {activity.subject}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                  {activity.actor && ` by ${activity.actor}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
