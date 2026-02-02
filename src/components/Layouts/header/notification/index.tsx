"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "./icons";

type NotificationType = "info" | "success" | "warning" | "error";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
};

// Mock notifications - in production, these would come from an API
const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "success",
    title: "Course Published",
    message: "Advanced TypeScript has been published successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    link: "/courses",
  },
  {
    id: "2",
    type: "info",
    title: "New Enrollment",
    message: "15 students enrolled in React Fundamentals",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    link: "/enrollments",
  },
  {
    id: "3",
    type: "warning",
    title: "Device Change Request",
    message: "3 pending device change requests require approval",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    link: "/device-change-requests",
  },
];

const typeStyles: Record<NotificationType, string> = {
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<NotificationItem[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <DropdownTrigger
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 outline-none transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        aria-label={`View Notifications${hasUnread ? ` (${unreadCount} unread)` : ""}`}
      >
        <BellIcon className="h-5 w-5" />

        {hasUnread && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownTrigger>

      <DropdownContent
        align="end"
        className="w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
          {hasUnread && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {unreadCount} new
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <BellIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={notification.link || "#"}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/10",
                  )}
                >
                  <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full", typeStyles[notification.type])}>
                    {typeIcons[notification.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !notification.read ? "font-medium text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>
                      {notification.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-gray-200 p-2 dark:border-gray-700">
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            View all notifications
          </Link>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
