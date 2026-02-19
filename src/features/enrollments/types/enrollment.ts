export type Enrollment = {
  id: string | number;
  student_id?: string | number;
  user_id?: string | number;
  course_id?: string | number;
  center_id?: string | number;
  status?: string;
  status_value?: number | string;
  status_key?: string;
  status_label?: string;
  enrolled_at?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ListEnrollmentsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: EnrollmentStatus | string;
  center_id?: string | number;
  course_id?: string | number;
  user_id?: string | number;
  student_id?: string | number;
  student_name?: string;
  student_phone?: string;
  date_from?: string;
  date_to?: string;
};

export type CreateEnrollmentPayload = {
  student_id: string | number;
  course_id: string | number;
  status?: string;
  [key: string]: unknown;
};

export type EnrollmentStatus =
  | "ACTIVE"
  | "DEACTIVATED"
  | "CANCELLED"
  | "PENDING";

export type CreateCenterEnrollmentPayload = {
  user_id: string | number;
  course_id: string | number;
  status?: EnrollmentStatus;
  [key: string]: unknown;
};

export type UpdateEnrollmentPayload = {
  status: string;
  [key: string]: unknown;
};

export type BulkEnrollmentsPayload = {
  course_id: string | number;
  user_ids: Array<string | number>;
};

export type BulkEnrollmentStatusPayload = {
  status: EnrollmentStatus | string;
  enrollment_ids: Array<string | number>;
};

export type BulkEnrollmentResult = {
  counts?: Record<string, number | string | null | undefined>;
  approved?: Array<Record<string, unknown>>;
  updated?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};
