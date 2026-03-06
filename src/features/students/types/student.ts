export type StudentDevice = {
  id?: number | string | null;
  device_id?: string | null;
  device_name?: string | null;
  device_type?: string | null;
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

export type StudentEducationEntity = {
  id?: number | string | null;
  name?: string | null;
  stage?: number | null;
  stage_label?: string | null;
  type?: number | string | null;
  type_label?: string | null;
  is_active?: boolean | null;
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
  grade_id?: number | string | null;
  school_id?: number | string | null;
  college_id?: number | string | null;
  center?: StudentCenter | null;
  grade?: StudentEducationEntity | null;
  school?: StudentEducationEntity | null;
  college?: StudentEducationEntity | null;
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

// Student Profile Types

export type DeviceChangeLog = {
  device_name: string;
  device_id: string;
  changed_at: string;
  reason: string | null;
};

export type ProfileCourseVideo = {
  id: number;
  title: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  duration?: number | string | null;
  watch_count: number;
  watch_limit: number | null;
  watch_progress_percentage: number;
};

export type ProfileEnrollmentCourse = {
  id: number;
  title: string;
  thumbnail_url: string | null;
  video_count: number;
  videos: ProfileCourseVideo[];
};

export type StudentEnrollment = {
  id: number;
  enrolled_at: string;
  expires_at: string | null;
  status: string;
  status_label: string;
  progress_percentage: number;
  course: ProfileEnrollmentCourse;
};

export type StudentProfile = {
  id: number;
  name: string;
  username: string | null;
  email: string | null;
  phone: string;
  country_code: string;
  avatar_url: string | null;
  status: number;
  status_label: "Active" | "Inactive" | "Banned";

  last_activity_at: string | null;
  active_device?: StudentDevice | null;
  device?: StudentDevice | null;
  total_enrollments: number;
  device_changes_count: number;

  device_change_log: DeviceChangeLog[];
  center: {
    id: number;
    name: string;
  } | null;
  grade?: StudentEducationEntity | null;
  school?: StudentEducationEntity | null;
  college?: StudentEducationEntity | null;
  enrollments: StudentEnrollment[];
};
