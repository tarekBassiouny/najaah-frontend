export type Enrollment = {
  id: string | number;
  student_id?: string | number;
  course_id?: string | number;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ListEnrollmentsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  center_id?: string | number;
  course_id?: string | number;
  student_id?: string | number;
};

export type CreateEnrollmentPayload = {
  student_id: string | number;
  course_id: string | number;
  status?: string;
  [key: string]: unknown;
};

export type UpdateEnrollmentPayload = {
  status: string;
  [key: string]: unknown;
};
