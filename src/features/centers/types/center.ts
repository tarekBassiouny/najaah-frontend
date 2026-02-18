export type CenterSetting = {
  id?: string | number;
  center_id?: string | number;
  key?: string;
  value?: string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  settings?: Record<string, any> | any[];
  [key: string]: any;
};

export type CenterTypeValue = "branded" | "unbranded" | string;
export type CenterTierValue = "standard" | "premium" | "vip" | string;
export type CenterStatusValue = 0 | 1 | number;

export type Center = {
  id: string | number;
  name?: string;
  slug?: string;
  type?: CenterTypeValue;
  tier?: CenterTierValue;
  status?: CenterStatusValue;
  status_label?: string | null;
  onboarding_status?: string | null;
  is_featured?: boolean;
  logo_url?: string | null;
  deleted_at?: string | null;
  branding_metadata?: Record<string, unknown> | null;
  primary_color?: string | null;
  description?: string | null;
  name_translations?: Record<string, string | null> | null;
  description_translations?: Record<string, string | null> | null;
  setting?: CenterSetting | null;
  settings?: CenterSetting[] | Record<string, unknown>;
  [key: string]: any;
};
