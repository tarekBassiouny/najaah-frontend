import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  deleteAdminNotification,
  getAdminNotificationsUnreadCount,
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from "../services/notifications.service";
import type {
  AdminNotification,
  ListAdminNotificationsParams,
  ListAdminNotificationsResponse,
} from "../types/notification";

export const adminNotificationsQueryKeys = {
  all: ["admin-notifications"] as const,
  list: (params: ListAdminNotificationsParams) =>
    ["admin-notifications", "list", params] as const,
  unreadCount: () => ["admin-notifications", "unread-count"] as const,
};

type UseAdminNotificationsOptions = Omit<
  UseQueryOptions<ListAdminNotificationsResponse>,
  "queryKey" | "queryFn"
>;

export function useAdminNotifications(
  params: ListAdminNotificationsParams,
  options?: UseAdminNotificationsOptions,
) {
  return useQuery({
    queryKey: adminNotificationsQueryKeys.list(params),
    queryFn: () => listAdminNotifications(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseUnreadCountOptions = Omit<
  UseQueryOptions<number>,
  "queryKey" | "queryFn"
>;

export function useAdminNotificationsUnreadCount(
  options?: UseUnreadCountOptions,
) {
  return useQuery({
    queryKey: adminNotificationsQueryKeys.unreadCount(),
    queryFn: getAdminNotificationsUnreadCount,
    ...options,
  });
}

export function useMarkAdminNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => markAdminNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKeys.unreadCount(),
      });
    },
  });
}

export function useMarkAllAdminNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAdminNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKeys.unreadCount(),
      });
    },
  });
}

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteAdminNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: adminNotificationsQueryKeys.unreadCount(),
      });
    },
  });
}

export function toReadNotification(
  notification: AdminNotification,
): AdminNotification {
  if (notification.isRead) return notification;
  return {
    ...notification,
    isRead: true,
    readAt: notification.readAt || new Date().toISOString(),
  };
}
