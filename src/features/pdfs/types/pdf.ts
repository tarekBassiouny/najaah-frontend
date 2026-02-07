export type TranslationsRecord = Record<string, string>;

export type Pdf = {
  id: string | number;
  title?: string | null;
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  source_id?: string | null;
  source_url?: string | null;
  file_extension?: string | null;
  file_size_kb?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course_id?: string | number | null;
  [key: string]: unknown;
};

export type PdfUploadSession = {
  id: string | number;
  upload_url?: string;
  status?: string;
  original_filename?: string;
  file_size_kb?: number;
  [key: string]: unknown;
};
