export type TranslationsRecord = Record<string, string>;

export type Role = {
  id: number | string;
  name?: string | null;
  name_translations?: TranslationsRecord | null;
  slug?: string | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  permissions?: Array<RolePermission | string> | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type RolePermission = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  [key: string]: unknown;
};
