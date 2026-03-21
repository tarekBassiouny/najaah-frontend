import { http } from "@/lib/http";
import type {
  CenterSettingsPageContext,
  CenterSettingsSections,
  CenterSettingsSummary,
  CenterSettingsCatalog,
  CenterSettingsData,
  CenterSettingsMap,
} from "@/features/centers/types/center";
import {
  asRecord,
  type DynamicAIProvider,
  type DynamicGroupedSettings,
} from "@/features/settings/lib/dynamic-settings";

export type CenterSettingsResponse = CenterSettingsData;

export type UpdateCenterSettingsPayload = {
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

type RawCenterSettingsResponse = {
  data?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
};

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

function readBooleanMap(value: unknown): Record<string, boolean> {
  const record = asRecord(value);
  if (!record) return {};

  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [key, Boolean(entry)]),
  );
}

function readGroupedSettings(value: unknown): DynamicGroupedSettings {
  const record = asRecord(value);
  if (!record) return {};

  return Object.fromEntries(
    Object.entries(record).map(([group, entries]) => [
      group,
      readSettingsMap(entries),
    ]),
  );
}

function readSections(value: unknown): CenterSettingsSections | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  const settings = asRecord(record.settings);
  const features = asRecord(record.features);
  const ai = asRecord(record.ai);

  return {
    settings: settings
      ? {
          groups: readGroupedSettings(settings.groups),
          resolved_groups: readGroupedSettings(settings.resolved_groups),
        }
      : undefined,
    features: features
      ? {
          values: readBooleanMap(features.values),
        }
      : undefined,
    ai: ai
      ? {
          feature_enabled:
            typeof ai.feature_enabled === "boolean"
              ? ai.feature_enabled
              : undefined,
          providers: Array.isArray(ai.providers)
            ? (ai.providers.filter((provider): provider is DynamicAIProvider =>
                Boolean(asRecord(provider)),
              ) as DynamicAIProvider[])
            : [],
        }
      : undefined,
  };
}

function readPage(value: unknown): CenterSettingsPageContext | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  const editable = asRecord(record.editable);
  const aiEditable = asRecord(editable?.ai);

  return {
    ...record,
    editable: editable
      ? {
          settings: Array.isArray(editable.settings)
            ? editable.settings.filter(
                (entry): entry is string => typeof entry === "string",
              )
            : [],
          features: Array.isArray(editable.features)
            ? editable.features.filter(
                (entry): entry is string => typeof entry === "string",
              )
            : [],
          ai: {
            providers: aiEditable?.providers
              ? Object.fromEntries(
                  Object.entries(asRecord(aiEditable.providers) ?? {}).map(
                    ([key, fields]) => [
                      key,
                      Array.isArray(fields)
                        ? fields.filter(
                            (field): field is string =>
                              typeof field === "string",
                          )
                        : [],
                    ],
                  ),
                )
              : {},
          },
        }
      : undefined,
  };
}

function readSummaries(value: unknown): CenterSettingsSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asRecord(entry))
    .filter(Boolean) as CenterSettingsSummary[];
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
    system_constraints: readSettingsMap(payload.system_constraints),
    catalog: readCatalog(payload.catalog),
    features: readBooleanMap(payload.features),
    page: readPage(payload.page),
    sections: readSections(payload.sections),
    summaries: readSummaries(payload.summaries),
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
