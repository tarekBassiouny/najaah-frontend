export type StudentDevice = {
  id?: number | string | null;
  device_id?: string | null;
  model?: string | null;
  os_version?: string | null;
  status?: number | string | null;
  status_key?: string | null;
  status_label?: string | null;
  approved_at?: string | null;
  last_used_at?: string | null;
  [key: string]: unknown;
};

export type StudentAnalytics = {
  total_enrollments?: number | null;
  active_enrollments?: number | null;
  total_sessions?: number | null;
  full_play_sessions?: number | null;
  viewed_videos?: number | null;
  last_activity_at?: string | null;
  [key: string]: unknown;
};

export type StudentCenter = {
  id?: number | string | null;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type Student = {
  id: number | string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  country_code?: string | null;
  status?: number | string | null;
  status_key?: string | null;
  status_label?: string | null;
  center_id?: number | string | null;
  center?: StudentCenter | null;
  device?: StudentDevice | null;
  analytics?: StudentAnalytics | null;
  enrollments_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type StudentImportResult = {
  total?: number;
  success?: number;
  failed?: number;
  errors?: Array<{
    row?: number;
    message?: string;
  }>;
  [key: string]: unknown;
};
