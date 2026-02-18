import { http } from "@/lib/http";
import type {
  AdminNotification,
  AdminNotificationType,
  ListAdminNotificationsParams,
  ListAdminNotificationsResponse,
} from "../types/notification";

const BASE_PATH = "/api/v1/admin/notifications";

type RawEnvelope = {
  data?: unknown;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
  [key: string]: unknown;
};

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getNullableString(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : null;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized === "1" || normalized === "true";
  }
  return false;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTranslations(value: unknown) {
  const entries = Object.entries(getRecord(value));
  const translations: Record<string, string> = {};

  for (const [key, item] of entries) {
    if (typeof item === "string") {
      translations[key] = item;
    }
  }

  return translations;
}

function normalizeNotification(rawValue: unknown): AdminNotification {
  const raw = getRecord(rawValue);
  const payload = raw.data;
  const data =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;

  return {
    id: (raw.id as string | number) ?? "",
    type: toNumber(raw.type, 1) as AdminNotificationType,
    typeLabel: getString(raw.type_label ?? raw.typeLabel),
    typeLabelTranslations: getTranslations(
      raw.type_label_translations ?? raw.typeLabelTranslations,
    ),
    typeIcon: getString(raw.type_icon ?? raw.typeIcon) || "alert-circle",
    title: getString(raw.title),
    body: getNullableString(raw.body),
    data,
    isRead: toBoolean(raw.is_read ?? raw.isRead),
    readAt: getNullableString(raw.read_at ?? raw.readAt),
    createdAt: getString(raw.created_at ?? raw.createdAt),
  };
}

function extractListPayload(responseData: unknown) {
  const root = getRecord(responseData) as RawEnvelope;
  const dataNode = root.data;

  const rootItems = Array.isArray(dataNode) ? dataNode : null;
  const nested = getRecord(dataNode) as RawEnvelope;
  const nestedItems = Array.isArray(nested.data) ? nested.data : null;

  const items = rootItems ?? nestedItems ?? [];
  const meta = root.meta ?? nested.meta ?? {};

  return { items, meta };
}

export async function listAdminNotifications(
  params: ListAdminNotificationsParams = {},
): Promise<ListAdminNotificationsResponse> {
  const { data } = await http.get(BASE_PATH, {
    params: {
      page: params.page,
      per_page: params.per_page,
      unread_only:
        params.unread_only == null ? undefined : params.unread_only ? 1 : 0,
      type: params.type ?? undefined,
      since: params.since ?? undefined,
    },
  });

  const payload = extractListPayload(data);
  const page = payload.meta.page ?? params.page ?? 1;
  const perPage = payload.meta.per_page ?? params.per_page ?? 15;
  const total = payload.meta.total ?? payload.items.length;
  const lastPage =
    payload.meta.last_page ?? Math.max(1, Math.ceil(total / perPage));

  return {
    items: payload.items.map(normalizeNotification),
    meta: {
      page,
      per_page: perPage,
      total,
      last_page: lastPage,
    },
  };
}

export async function getAdminNotificationsUnreadCount(): Promise<number> {
  const { data } = await http.get(`${BASE_PATH}/count`);
  const root = getRecord(data);
  const payload = getRecord(root.data);
  return toNumber(payload.unread_count ?? payload.unreadCount, 0);
}

export async function markAdminNotificationAsRead(
  id: string | number,
): Promise<AdminNotification> {
  const { data } = await http.put(`${BASE_PATH}/${id}/read`);
  const root = getRecord(data);
  return normalizeNotification(root.data ?? root);
}

export async function markAllAdminNotificationsAsRead(): Promise<number> {
  const { data } = await http.post(`${BASE_PATH}/read-all`);
  const root = getRecord(data);
  const payload = getRecord(root.data);
  return toNumber(payload.marked_count ?? payload.markedCount, 0);
}

export async function deleteAdminNotification(
  id: string | number,
): Promise<void> {
  await http.delete(`${BASE_PATH}/${id}`);
}
