export type TranslationsRecord = Record<string, string>;

export type Video = {
  id: string | number;
  title?: string | null;
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  tags?: string[] | null;
  status?: string | null;
  duration?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course_id?: string | number | null;
  [key: string]: unknown;
};

export type VideoUploadSession = {
  id: string | number;
  upload_url?: string;
  status?: string;
  video_id?: string | number;
  original_filename?: string;
  [key: string]: unknown;
};
