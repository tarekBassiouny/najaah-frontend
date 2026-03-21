import type {
  DynamicSettingsCatalog,
  DynamicSettingsGroups,
} from "@/features/settings/lib/dynamic-settings";

export type SystemSettingValue = Record<string, unknown> | null;

export type SystemSetting = {
  id: string | number;
  key: string;
  value: SystemSettingValue;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type SystemSettingsListMeta = {
  page: number;
  per_page: number;
  total: number;
  last_page?: number;
  catalog: DynamicSettingsCatalog;
  catalog_groups: DynamicSettingsGroups;
  defaults: Record<string, unknown>;
  [key: string]: unknown;
};

export type SystemSettingsListResponse = {
  items: SystemSetting[];
  meta: SystemSettingsListMeta;
};
