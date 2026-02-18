export type AdminNotificationType = 1 | 2 | 3 | 4 | 5 | 6 | (number & {});

export type AdminNotificationTypeLabelTranslations = Partial<
  Record<"en" | "ar" | string, string>
>;

export type AdminNotificationPayload = Record<string, unknown> | null;

export type AdminNotification = {
  id: string | number;
  type: AdminNotificationType;
  typeLabel: string;
  typeLabelTranslations: AdminNotificationTypeLabelTranslations;
  typeIcon: string;
  title: string;
  body: string | null;
  data: AdminNotificationPayload;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ListAdminNotificationsParams = {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
  type?: AdminNotificationType;
  since?: number;
};

export type AdminNotificationsMeta = {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ListAdminNotificationsResponse = {
  items: AdminNotification[];
  meta: AdminNotificationsMeta;
};

export type NotificationTypeOption = {
  value: AdminNotificationType;
  label: string;
};

export const ADMIN_NOTIFICATION_TYPE_OPTIONS: NotificationTypeOption[] = [
  { value: 1, label: "System Alert" },
  { value: 2, label: "Device Change Request" },
  { value: 3, label: "Extra View Request" },
  { value: 4, label: "Survey Response" },
  { value: 5, label: "New Enrollment" },
  { value: 6, label: "Center Onboarding" },
];

export const DEFAULT_NOTIFICATION_POLL_INTERVAL_MS = 30_000;
