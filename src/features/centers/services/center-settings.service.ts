import { http } from "@/lib/http";
import type { CenterSetting } from "@/features/centers/types/center";

export type CenterSettingsResponse = {
  settings: CenterSetting[];
  [key: string]: unknown;
};

export type UpdateCenterSettingsPayload = {
  settings: Record<string, unknown>;
  [key: string]: unknown;
};

type RawCenterSettingsResponse = {
  data?: CenterSetting[] | Record<string, unknown>;
  settings?: CenterSetting[] | Record<string, unknown>;
  [key: string]: unknown;
};

export async function getCenterSettings(
  centerId: string | number,
): Promise<CenterSettingsResponse> {
  const { data } = await http.get<RawCenterSettingsResponse>(
    `/api/v1/admin/centers/${centerId}/settings`,
  );

  const settings = Array.isArray(data?.data)
    ? data?.data
    : Array.isArray(data?.settings)
      ? data?.settings
      : [];

  return { settings };
}

export async function updateCenterSettings(
  centerId: string | number,
  payload: UpdateCenterSettingsPayload,
): Promise<CenterSettingsResponse> {
  const { data } = await http.patch<RawCenterSettingsResponse>(
    `/api/v1/admin/centers/${centerId}/settings`,
    payload,
  );

  const settings = Array.isArray(data?.data)
    ? data?.data
    : Array.isArray(data?.settings)
      ? data?.settings
      : [];

  return { settings };
}
