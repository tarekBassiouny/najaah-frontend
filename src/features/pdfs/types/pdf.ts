export type TranslationsRecord = Record<string, string>;

export type Pdf = {
  id: string | number;
  title?: string | null;
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  tags?: string[] | null;
  creator?: {
    id?: string | number;
    name?: string | null;
  } | null;
  source_type?: number | string | null;
  source_provider?: string | null;
  source_label?: number | string | null;
  source_id?: string | null;
  source_url?: string | null;
  file_extension?: string | null;
  file_size?: number | string | null;
  file_size_kb?: number | null;
  status?: string | number | null;
  upload_status?: number | null;
  upload_status_label?: string | null;
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course_id?: string | number | null;
  courses_count?: number | null;
  sections_count?: number | null;
  can_delete?: boolean | null;
  [key: string]: unknown;
};

export type PdfUploadSession = {
  upload_session_id?: string | number;
  upload_endpoint?: string | null;
  required_headers?: Record<string, string> | null;
  expires_at?: string | null;
  upload_status?: number | null;
  error_message?: string | null;
  pdf_id?: string | number | null;
  id?: string | number;
  upload_url?: string | null;
  status?: string | number | null;
  original_filename?: string;
  file_size_kb?: number | null;
  _response_message?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};
