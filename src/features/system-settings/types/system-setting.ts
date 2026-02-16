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
