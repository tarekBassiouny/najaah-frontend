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
