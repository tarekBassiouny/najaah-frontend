export type TranslationsRecord = Record<string, string>;

export type InstructorCenter = {
  id?: number | string | null;
  name?: string | null;
  slug?: string | null;
};

export type InstructorCreator = {
  id?: number | string | null;
  name?: string | null;
};

export type InstructorSocialLinks =
  | string[]
  | Record<string, string | null | undefined>;

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
  social_links?: InstructorSocialLinks | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
  status_label?: string | null;
  status_key?: string | null;
  center_id?: number | string | null;
  center?: InstructorCenter | null;
  creator?: InstructorCreator | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};
