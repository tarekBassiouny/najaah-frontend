export type AssignmentAttachableType = "video" | "pdf" | "section" | "course";

export type Assignment = {
  id: number;
  center_id?: number;
  course_id?: number;
  title?: string | null;
  title_translations?: Record<string, string> | null;
  description?: string | null;
  description_translations?: Record<string, string> | null;
  attachable_type?: AssignmentAttachableType | null;
  attachable_id?: number | null;
  submission_types?: number[] | null;
  max_points?: number | null;
  passing_score?: number | null;
  is_group_assignment?: boolean;
  max_group_size?: number | null;
  is_required?: boolean;
  is_active?: boolean;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type ListCourseAssignmentsParams = {
  centerId: string | number;
  courseId: string | number;
  page: number;
  per_page: number;
};

export type CourseAssignmentsResponse = {
  items: Assignment[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

export type CreateCourseAssignmentPayload = {
  title_translations: {
    en: string;
    ar?: string;
  };
  description_translations?: {
    en?: string;
    ar?: string;
  };
  attachable_type?: AssignmentAttachableType;
  attachable_id?: number;
  submission_types?: number[];
  max_points?: number;
  passing_score?: number;
  is_group_assignment?: boolean;
  max_group_size?: number;
  is_required?: boolean;
  is_active?: boolean;
  due_date?: string;
};
