import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  SystemSetting,
  SystemSettingValue,
} from "@/features/system-settings/types/system-setting";

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

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function normalizeListResponse(
  raw: RawResponse | undefined,
  fallback: ListSystemSettingsParams,
): PaginatedResponse<SystemSetting> {
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

  return {
    items,
    meta: {
      page,
      per_page: perPage,
      total,
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
): Promise<PaginatedResponse<SystemSetting>> {
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

export async function createSystemSetting(
  payload: CreateSystemSettingPayload,
): Promise<SystemSetting> {
  const { data } = await http.post<RawResponse>(
    "/api/v1/admin/settings",
    payload,
  );
  return normalizeEntityResponse(data);
}

export async function updateSystemSetting(
  id: string | number,
  payload: UpdateSystemSettingPayload,
): Promise<SystemSetting> {
  const { data } = await http.put<RawResponse>(
    `/api/v1/admin/settings/${id}`,
    payload,
  );
  return normalizeEntityResponse(data);
}

export async function deleteSystemSetting(id: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/settings/${id}`);
}

export async function getSystemSettingsPreview(): Promise<SystemSettingsPreviewResponse> {
  const { data } = await http.get<RawResponse>(
    "/api/v1/admin/settings/preview",
  );
  return normalizePreviewResponse(data);
}
