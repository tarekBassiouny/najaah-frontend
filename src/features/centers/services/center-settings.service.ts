import { http } from "@/lib/http";
import type {
  CenterSettingsCatalog,
  CenterSettingsData,
  CenterSettingsMap,
} from "@/features/centers/types/center";

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

function readScalarId(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function readSettingsMap(value: unknown): CenterSettingsMap {
  return asRecord(value) ?? {};
}

function readCatalog(value: unknown): CenterSettingsCatalog {
  const record = asRecord(value);
  if (!record) return {};

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [key, asRecord(entry) ?? {}]),
  );
}

function normalizeCenterSettingsResponse(
  raw: RawCenterSettingsResponse | undefined,
): CenterSettingsResponse {
  const container = asRecord(raw) ?? {};
  const payload = asRecord(container.data) ?? container;

  return {
    ...payload,
    id: readScalarId(payload.id),
    center_id: readScalarId(payload.center_id),
    settings: readSettingsMap(payload.settings),
    resolved_settings: readSettingsMap(payload.resolved_settings),
    system_defaults: readSettingsMap(payload.system_defaults),
    catalog: readCatalog(payload.catalog),
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
