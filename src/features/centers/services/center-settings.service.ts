import { http } from "@/lib/http";
import type { CenterSettingsData } from "@/features/centers/types/center";

export type CenterSettingsResponse = CenterSettingsData;

export type UpdateCenterSettingsPayload = {
  settings: Record<string, unknown>;
  [key: string]: unknown;
};

type RawCenterSettingsResponse = {
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeCenterSettingsResponse(
  raw: RawCenterSettingsResponse | undefined,
): CenterSettingsResponse {
  const container = asRecord(raw) ?? {};
  const payload = asRecord(container.data) ?? container;

  return {
    ...payload,
    id: payload.id,
    center_id: payload.center_id,
    settings: asRecord(payload.settings) ?? {},
    resolved_settings: asRecord(payload.resolved_settings) ?? {},
    system_defaults: asRecord(payload.system_defaults) ?? {},
    catalog: asRecord(payload.catalog) ?? {},
  };
}

export async function getCenterSettings(
  centerId: string | number,
): Promise<CenterSettingsResponse> {
  const { data } = await http.get<RawCenterSettingsResponse>(
    `/api/v1/admin/centers/${centerId}/settings`,
  );

  return normalizeCenterSettingsResponse(data);
}

export async function updateCenterSettings(
  centerId: string | number,
  payload: UpdateCenterSettingsPayload,
): Promise<CenterSettingsResponse> {
  const { data } = await http.patch<RawCenterSettingsResponse>(
    `/api/v1/admin/centers/${centerId}/settings`,
    payload,
  );

  return normalizeCenterSettingsResponse(data);
}
