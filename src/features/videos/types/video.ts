export type Video = {
  id: string | number;
  title?: string | null;
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
  [key: string]: unknown;
};
