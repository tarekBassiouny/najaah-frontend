"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { getApiLocale } from "@/lib/runtime-config";
import { useEffect, useMemo, useState } from "react";
import { BellIcon } from "@/components/Layouts/header/notification/icons";
import {
  useAdminNotifications,
  useAdminNotificationsUnreadCount,
  useDeleteAdminNotification,
  useMarkAdminNotificationAsRead,
  useMarkAllAdminNotificationsAsRead,
  toReadNotification,
} from "../hooks/use-notifications";
import {
  ADMIN_NOTIFICATION_TYPE_OPTIONS,
  DEFAULT_NOTIFICATION_POLL_INTERVAL_MS,
  type AdminNotification,
  type AdminNotificationType,
} from "../types/notification";

type NotificationIconProps = {
  iconName: string;
  className?: string;
};

function NotificationIcon({ iconName, className }: NotificationIconProps) {
  const iconClassName = className ?? "h-4 w-4";

  if (iconName === "smartphone") {
    return (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 3.75h6A2.25 2.25 0 0117.25 6v12A2.25 2.25 0 0115 20.25H9A2.25 2.25 0 016.75 18V6A2.25 2.25 0 019 3.75z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10.5 17.25h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (iconName === "eye") {
    return (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <path
          d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="12"
          cy="12"
          r="2.75"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (iconName === "clipboard-check") {
    return (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <rect
          x="5.25"
          y="4.25"
          width="13.5"
          height="16.5"
          rx="2.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M9 11.5l1.75 1.75L15 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (iconName === "user-plus") {
    return (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3.5 18a5.5 5.5 0 0111 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M17 8v6m3-3h-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (iconName === "building") {
    return (
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <path
          d="M5.25 20.25V5.625c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125V20.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M9 20.25v-3.375h6v3.375M9 8.25h1.5m3 0H15m-6 3h1.5m3 0H15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8v5m0 3h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function toIdParam(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function withQuery(
  path: string,
  params: Record<string, string | null | undefined>,
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    searchParams.set(key, value);
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function mapSurveyResponsePath(path: string): string | null {
  try {
    const parsed = new URL(path, "http://localhost");
    const pathname = parsed.pathname.replace(/\/+$/, "");

    const centerMatch = pathname.match(
      /^\/(?:admin\/)?centers\/([^/]+)\/surveys\/([^/]+)\/responses\/([^/]+)$/i,
    );
    if (centerMatch) {
      const [, centerId, surveyId, responseId] = centerMatch;
      return withQuery(`/centers/${encodeURIComponent(centerId)}/surveys`, {
        open_results_survey_id: surveyId,
        focus_tab: "responses",
        response_id: responseId,
      });
    }

    const systemMatch = pathname.match(
      /^\/(?:admin\/)?surveys\/([^/]+)\/responses\/([^/]+)$/i,
    );
    if (systemMatch) {
      const [, surveyId, responseId] = systemMatch;
      return withQuery("/surveys", {
        open_results_survey_id: surveyId,
        focus_tab: "responses",
        response_id: responseId,
      });
    }
  } catch {
    return null;
  }

  return null;
}

function resolveActionPath(notification: AdminNotification): string | null {
  const payload = notification.data ?? {};
  const rawAction = payload.action_url;
  const entityType = String(payload.entity_type ?? "").toLowerCase();

  if (typeof rawAction === "string" && rawAction.trim()) {
    let next = rawAction.trim();
    if (next.startsWith("http://") || next.startsWith("https://")) {
      try {
        const parsed = new URL(next);
        next = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return null;
      }
    }

    if (!next.startsWith("/")) {
      next = `/${next}`;
    }

    const mappedSurveyPath = mapSurveyResponsePath(next);
    if (mappedSurveyPath) return mappedSurveyPath;

    if (next.startsWith("/admin/")) {
      next = next.replace(/^\/admin/, "");
    }

    return next || null;
  }

  if (entityType === "device_change_request") {
    const centerId = toIdParam(payload.center_id);
    return centerId
      ? `/centers/${encodeURIComponent(centerId)}/student-requests/device-change`
      : "/student-requests/device-change";
  }
  if (entityType === "extra_view_request") {
    const centerId = toIdParam(payload.center_id);
    return centerId
      ? `/centers/${encodeURIComponent(centerId)}/student-requests/extra-view`
      : "/student-requests/extra-view";
  }
  if (entityType === "survey_response") {
    const centerId = toIdParam(payload.center_id);
    const surveyId = toIdParam(payload.survey_id ?? payload.entity_id);
    const responseId = toIdParam(payload.entity_id);

    if (centerId && surveyId) {
      return withQuery(`/centers/${encodeURIComponent(centerId)}/surveys`, {
        open_results_survey_id: surveyId,
        focus_tab: "responses",
        response_id: responseId,
      });
    }

    if (surveyId) {
      return withQuery("/surveys", {
        open_results_survey_id: surveyId,
        focus_tab: "responses",
        response_id: responseId,
      });
    }

    return "/surveys";
  }
  if (entityType === "enrollment_request" || entityType === "enrollment") {
    const centerId = toIdParam(payload.center_id);
    return centerId
      ? `/centers/${encodeURIComponent(centerId)}/student-requests/enrollments`
      : "/student-requests/enrollments";
  }
  if (entityType === "center") return "/centers";

  return null;
}

function getTypeLabel(notification: AdminNotification) {
  const locale = getApiLocale().toLowerCase().startsWith("ar") ? "ar" : "en";
  return (
    notification.typeLabelTranslations[locale] ||
    notification.typeLabel ||
    "Notification"
  );
}

function getRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return formatDistanceToNow(date, { addSuffix: true });
}

function mergeUniqueNotifications(
  current: AdminNotification[],
  incoming: AdminNotification[],
) {
  const seen = new Set(current.map((item) => String(item.id)));
  const appended = incoming.filter((item) => !seen.has(String(item.id)));
  return [...current, ...appended];
}

export function AdminNotificationsDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [openActionMenuId, setOpenActionMenuId] = useState<
    string | number | null
  >(null);

  const typeValue =
    selectedType === "all"
      ? undefined
      : (Number(selectedType) as AdminNotificationType);

  const params = useMemo(
    () => ({
      page,
      per_page: 15,
      unread_only: unreadOnly ? true : undefined,
      type: Number.isFinite(Number(typeValue)) ? typeValue : undefined,
    }),
    [page, unreadOnly, typeValue],
  );

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch: refetchNotifications,
  } = useAdminNotifications(params, {
    enabled: isOpen,
    refetchInterval: isOpen ? DEFAULT_NOTIFICATION_POLL_INTERVAL_MS : false,
    staleTime: 5_000,
  });

  const { data: unreadCountValue = 0 } = useAdminNotificationsUnreadCount({
    refetchInterval: DEFAULT_NOTIFICATION_POLL_INTERVAL_MS,
    staleTime: 5_000,
  });

  const markAsReadMutation = useMarkAdminNotificationAsRead();
  const markAllAsReadMutation = useMarkAllAdminNotificationsAsRead();
  const deleteNotificationMutation = useDeleteAdminNotification();

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setNotifications([]);
    setOpenActionMenuId(null);
  }, [isOpen, unreadOnly, selectedType]);

  useEffect(() => {
    if (!data) return;

    setNotifications((current) => {
      if (page === 1) return data.items;
      return mergeUniqueNotifications(current, data.items);
    });
  }, [data, page]);

  const unreadCount =
    unreadCountValue ||
    notifications.reduce((count, item) => count + (item.isRead ? 0 : 1), 0);
  const hasUnread = unreadCount > 0;
  const lastPage = data?.meta.last_page ?? 1;
  const hasMore = page < lastPage;
  const isListLoading = isLoading || (isFetching && notifications.length === 0);

  const handleOpenNotification = async (notification: AdminNotification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
      setNotifications((current) => {
        const next = current.map((item) =>
          item.id === notification.id ? toReadNotification(item) : item,
        );
        if (!unreadOnly) return next;
        return next.filter((item) => !item.isRead);
      });
    }

    const actionPath = resolveActionPath(notification);
    if (actionPath) {
      setIsOpen(false);
      router.push(actionPath);
    }
  };

  const handleMarkAsRead = async (notificationId: string | number) => {
    await markAsReadMutation.mutateAsync(notificationId);
    setNotifications((current) => {
      const next = current.map((item) =>
        item.id === notificationId ? toReadNotification(item) : item,
      );
      if (!unreadOnly) return next;
      return next.filter((item) => !item.isRead);
    });
  };

  const handleDelete = async (notificationId: string | number) => {
    await deleteNotificationMutation.mutateAsync(notificationId);
    setNotifications((current) =>
      current.filter((item) => item.id !== notificationId),
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
    setNotifications((current) => {
      if (unreadOnly) return [];
      return current.map(toReadNotification);
    });
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 outline-none transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        aria-label={`View Notifications${hasUnread ? ` (${unreadCount} unread)` : ""}`}
      >
        <BellIcon className="h-5 w-5" />

        {hasUnread ? (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownTrigger>

      <DropdownContent
        align="end"
        ignoreOutsideClickSelector='[data-click-outside-ignore="true"]'
        className="w-[min(94vw,26rem)] max-w-[calc(100vw-1rem)] rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 max-sm:fixed max-sm:inset-x-2 max-sm:top-[4.25rem] max-sm:mt-0 max-sm:w-auto max-sm:max-w-none"
      >
        <div className="rounded-md border border-gray-200 bg-gray-50/90 p-3 dark:border-gray-700 dark:bg-gray-800/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              {hasUnread ? (
                <Badge variant="default" className="px-2 py-0 text-[10px]">
                  {unreadCount} new
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={!hasUnread || markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="inline-flex shrink-0 items-center rounded-md bg-white p-0.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  !unreadOnly
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60",
                )}
                onClick={() => setUnreadOnly(false)}
              >
                All
              </button>
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  unreadOnly
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60",
                )}
                onClick={() => setUnreadOnly(true)}
              >
                Unread
              </button>
            </div>

            <div className="ml-auto w-[9.25rem] max-w-[44vw] shrink-0">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger
                  aria-label="Filter notifications by type"
                  className="h-8 w-full px-2 text-xs"
                >
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent data-click-outside-ignore="true">
                  <SelectItem value="all">All types</SelectItem>
                  {ADMIN_NOTIFICATION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isError ? (
          <div className="px-3 pb-3 pt-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load notifications.
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-primary"
              onClick={() => refetchNotifications()}
            >
              Try again
            </button>
          </div>
        ) : null}

        {isListLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700/60"
              />
            ))}
          </div>
        ) : null}

        {!isError && !isListLoading && notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <BellIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications found.
            </p>
          </div>
        ) : null}

        {!isError && !isListLoading && notifications.length > 0 ? (
          <ul className="mt-2 max-h-[55vh] overflow-y-auto sm:max-h-96">
            {notifications.map((notification) => (
              <li key={notification.id} className="px-1">
                <div
                  className={cn(
                    "mb-1 flex gap-2 rounded-md border border-transparent px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/70",
                    !notification.isRead &&
                      "border-primary/20 bg-primary/5 dark:bg-primary/10",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    aria-label={`Open notification: ${notification.title}`}
                    onClick={() => handleOpenNotification(notification)}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        !notification.isRead
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
                      )}
                    >
                      <NotificationIcon
                        iconName={notification.typeIcon}
                        className="h-4 w-4"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            notification.isRead
                              ? "text-gray-700 dark:text-gray-300"
                              : "font-semibold text-gray-900 dark:text-white",
                          )}
                        >
                          {notification.title || getTypeLabel(notification)}
                        </p>
                        <Badge
                          variant={notification.isRead ? "outline" : "default"}
                          className="hidden px-1.5 py-0 text-[10px] sm:inline-flex"
                        >
                          {getTypeLabel(notification)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {notification.body || getTypeLabel(notification)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <span>{getRelativeTime(notification.createdAt)}</span>
                        {!notification.isRead ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-start">
                    <Dropdown
                      isOpen={openActionMenuId === notification.id}
                      setIsOpen={(value) =>
                        setOpenActionMenuId(value ? notification.id : null)
                      }
                    >
                      <DropdownTrigger
                        aria-label={`Actions for notification ${notification.id}`}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        ⋮
                      </DropdownTrigger>
                      <DropdownContent
                        align="end"
                        className="w-40 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      >
                        {!notification.isRead ? (
                          <button
                            type="button"
                            className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
                            aria-label={`Mark notification ${notification.id} as read`}
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleMarkAsRead(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                          >
                            Mark as read
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-900/20"
                          aria-label={`Delete notification ${notification.id}`}
                          onClick={() => {
                            setOpenActionMenuId(null);
                            handleDelete(notification.id);
                          }}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          Delete
                        </button>
                      </DropdownContent>
                    </Dropdown>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {hasMore && !isError ? (
          <div className="border-t border-gray-200 px-2 pb-1 pt-2 dark:border-gray-700">
            <button
              type="button"
              className="w-full rounded-md px-3 py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((current) => current + 1)}
              disabled={isFetching}
            >
              Load more
            </button>
          </div>
        ) : null}
      </DropdownContent>
    </Dropdown>
  );
}
