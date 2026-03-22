import { http } from "@/lib/http";
import {
  normalizeAdminActionResult,
  withResponseMessage,
  type AdminActionResult,
} from "@/lib/admin-response";
import type {
  SystemSetting,
  SystemSettingsListResponse,
  SystemSettingValue,
} from "@/features/system-settings/types/system-setting";
import type {
  DynamicSettingsCatalog,
  DynamicSettingsGroups,
} from "@/features/settings/lib/dynamic-settings";

export type ListSystemSettingsParams = {
  page: number;
  per_page: number;
  search?: string;
  is_public?: boolean | number | string;
};

export type CreateSystemSettingPayload = {
  key: string;
  value: SystemSettingValue;
  is_public: boolean;
};

export type UpdateSystemSettingPayload = {
  value?: SystemSettingValue;
  is_public?: boolean;
};

export type SystemSettingsPreviewResponse = Record<string, unknown>;
export type SystemSettingsByKey = Record<string, SystemSetting | null>;

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function normalizeListResponse(
  raw: RawResponse | undefined,
  fallback: ListSystemSettingsParams,
): SystemSettingsListResponse {
  const container =
    raw && typeof raw === "object" && raw !== null ? (raw as RawResponse) : {};

  const dataNode = (container.data ?? container) as Record<string, unknown>;
  const items = Array.isArray(dataNode?.data)
    ? (dataNode.data as SystemSetting[])
    : Array.isArray(dataNode)
      ? (dataNode as unknown as SystemSetting[])
      : [];

  const meta =
    (dataNode?.meta as Record<string, unknown> | undefined) ??
    (container.meta as Record<string, unknown> | undefined) ??
    {};

  const page =
    Number(meta.page ?? meta.current_page ?? dataNode?.page) || fallback.page;
  const perPage =
    Number(meta.per_page ?? dataNode?.per_page) || fallback.per_page;
  const total = Number(meta.total ?? dataNode?.total) || items.length;

  const catalog =
    (meta.catalog as DynamicSettingsCatalog | undefined) ??
    (dataNode?.catalog as DynamicSettingsCatalog | undefined) ??
    {};
  const catalogGroups =
    (meta.catalog_groups as DynamicSettingsGroups | undefined) ??
    (dataNode?.catalog_groups as DynamicSettingsGroups | undefined) ??
    {};
  const defaults =
    (meta.defaults as Record<string, unknown> | undefined) ??
    (dataNode?.defaults as Record<string, unknown> | undefined) ??
    {};

  return {
    items,
    meta: {
      page,
      per_page: perPage,
      total,
      last_page: Number(meta.last_page ?? dataNode?.last_page) || undefined,
      catalog,
      catalog_groups: catalogGroups,
      defaults,
    },
  };
}

function normalizeEntityResponse(raw: RawResponse | undefined): SystemSetting {
  const container =
    raw && typeof raw === "object" && raw !== null ? (raw as RawResponse) : {};

  return (container.data ?? container) as SystemSetting;
}

function normalizePreviewResponse(
  raw: RawResponse | undefined,
): SystemSettingsPreviewResponse {
  const container =
    raw && typeof raw === "object" && raw !== null ? (raw as RawResponse) : {};

  const payload =
    container.data &&
    typeof container.data === "object" &&
    !Array.isArray(container.data)
      ? (container.data as Record<string, unknown>)
      : container;

  const { success: _success, message: _message, ...rest } = payload;
  return rest;
}

function toPublicParam(
  value: ListSystemSettingsParams["is_public"],
): number | string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
}

export async function listSystemSettings(
  params: ListSystemSettingsParams,
): Promise<SystemSettingsListResponse> {
  const { data } = await http.get<RawResponse>("/api/v1/admin/settings", {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      is_public: toPublicParam(params.is_public),
    },
  });

  return normalizeListResponse(data, params);
}

export async function getSystemSetting(
  id: string | number,
): Promise<SystemSetting> {
  const { data } = await http.get<RawResponse>(`/api/v1/admin/settings/${id}`);
  return normalizeEntityResponse(data);
}

export async function findSystemSettingByKey(
  key: string,
): Promise<SystemSetting | null> {
  const response = await listSystemSettings({
    page: 1,
    per_page: 100,
    search: key,
  });

  return (
    response.items.find((item) => String(item.key).trim() === key.trim()) ??
    null
  );
}

export async function findSystemSettingsByKeys(
  keys: string[],
): Promise<SystemSettingsByKey> {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await findSystemSettingByKey(key)] as const),
  );

  return Object.fromEntries(entries);
}

export async function createSystemSetting(
  payload: CreateSystemSettingPayload,
): Promise<SystemSetting> {
  const { data } = await http.post<RawResponse>(
    "/api/v1/admin/settings",
    payload,
  );
  return withResponseMessage(normalizeEntityResponse(data), data);
}

export async function updateSystemSetting(
  id: string | number,
  payload: UpdateSystemSettingPayload,
): Promise<SystemSetting> {
  const { data } = await http.put<RawResponse>(
    `/api/v1/admin/settings/${id}`,
    payload,
  );
  return withResponseMessage(normalizeEntityResponse(data), data);
}

export async function deleteSystemSetting(
  id: string | number,
): Promise<AdminActionResult> {
  const { data } = await http.delete(`/api/v1/admin/settings/${id}`);
  return normalizeAdminActionResult(data);
}

export async function getSystemSettingsPreview(): Promise<SystemSettingsPreviewResponse> {
  const { data } = await http.get<RawResponse>(
    "/api/v1/admin/settings/preview",
  );
  return normalizePreviewResponse(data);
}
