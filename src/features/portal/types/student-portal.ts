import type { PaginatedResponse } from "@/types/pagination";

export type StudentPortalCourseSummary = {
  id: number | string;
  centerId: number | null;
  title: string;
  subtitle: string;
  badge: string;
  progress: number;
  lessonsLabel: string;
  metaLabel: string;
  href?: string;
  thumbnailUrl?: string | null;
  categoryId?: number | null;
  instructorId?: number | null;
  isFeatured?: boolean;
};

export type StudentPortalCategory = {
  id: number | string;
  title: string;
};

export type StudentPortalCourseDetail = {
  id: number | string;
  centerId: number | null;
  title: string;
  description: string;
  progress: number;
  lessonsCountLabel: string;
  durationLabel: string;
  instructorName?: string | null;
  instructorRole?: string | null;
  resources: string[];
  lessons: string[];
};

export type StudentPortalWeeklyActivity = {
  range: {
    days: number;
    timezone?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
  series: Array<{
    date: string;
    watchDurationSeconds: number;
    quizAttemptsCount: number;
    assignmentSubmissionsCount: number;
  }>;
  totals: {
    watchDurationSeconds: number;
    quizAttemptsCount: number;
    assignmentSubmissionsCount: number;
  };
};

export type StudentPortalProfileDetails = {
  isCompleteProfile: boolean;
  missingSteps: string[];
  missingFields: string[];
};

export type StudentPortalCourseListParams = {
  page?: number;
  per_page?: number;
  category_id?: number | string;
  instructor_id?: number | string;
  enrolled?: boolean;
  is_featured?: boolean;
  publish_from?: string;
  publish_to?: string;
  search?: string;
};

export type StudentPortalCourseListResponse =
  PaginatedResponse<StudentPortalCourseSummary>;
