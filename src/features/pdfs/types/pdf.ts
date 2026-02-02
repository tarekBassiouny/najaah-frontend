export type Pdf = {
  id: string | number;
  title?: string | null;
  status?: string | null;
  file_size?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course_id?: string | number | null;
  [key: string]: unknown;
};

export type PdfUploadSession = {
  id: string | number;
  upload_url?: string;
  status?: string;
  [key: string]: unknown;
};
