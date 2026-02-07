export type TranslationsRecord = Record<string, string>;

export type Instructor = {
  id: number | string;
  name?: string | null;
  name_translations?: TranslationsRecord | null;
  bio?: string | null;
  bio_translations?: TranslationsRecord | null;
  title?: string | null;
  title_translations?: TranslationsRecord | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  social_links?: string[] | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
  center_id?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};
