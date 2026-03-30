import { portalHttp } from "@/lib/portal-http";
import type {
  StudentPortalCategory,
  StudentPortalCourseDetail,
  StudentPortalCourseListParams,
  StudentPortalCourseListResponse,
  StudentPortalCourseSummary,
  StudentPortalProfileDetails,
  StudentPortalWeeklyActivity,
} from "@/features/portal/types/student-portal";

type RawPortalResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

function getRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = "",
): string {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
}

function pickNumber(
  source: Record<string, unknown> | null,
  keys: string[],
  fallback = 0,
): number {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function pickBoolean(source: Record<string, unknown> | null, key: string) {
  if (!source) return undefined;
  const value = source[key];
  return typeof value === "boolean" ? value : undefined;
}

function normalizeCourseSummary(
  raw: unknown,
): StudentPortalCourseSummary | null {
  const record = getRecord(raw);
  if (!record) return null;

  const idValue = record.id;
  if (typeof idValue !== "number" && typeof idValue !== "string") {
    return null;
  }

  const center =
    getRecord(record.center) ?? getRecord(record.course_center) ?? null;
  const instructor =
    getRecord(record.primary_instructor) ??
    getRecord(record.instructor) ??
    null;
  const progress = pickNumber(record, [
    "progress_percentage",
    "progress",
    "completion_percentage",
  ]);
  const lessonsCount = pickNumber(record, [
    "lessons_count",
    "videos_count",
    "assets_count",
  ]);
  const category = getRecord(record.category);

  return {
    id: idValue,
    centerId:
      pickNumber(center, ["id"], 0) ||
      pickNumber(record, ["center_id"], 0) ||
      null,
    title: pickString(record, ["title", "name"], "Course"),
    subtitle:
      pickString(record, ["short_description", "description"]) ||
      (lessonsCount > 0 ? `${lessonsCount} lessons` : ""),
    badge:
      pickString(category, ["title", "name"]) ||
      pickString(record, ["difficulty_label", "access_model"], "Course"),
    progress,
    lessonsLabel:
      lessonsCount > 0
        ? `${lessonsCount} lessons`
        : pickString(record, ["duration_text", "estimated_duration"], ""),
    metaLabel:
      pickString(instructor, ["name"]) ||
      pickString(record, ["teacher_name", "status"], ""),
    href:
      typeof idValue === "number" || typeof idValue === "string"
        ? `/portal/student/course/${idValue}`
        : undefined,
    thumbnailUrl:
      pickString(record, ["thumbnail_url", "image_url"], "") || null,
    categoryId: pickNumber(category, ["id"], 0) || null,
    instructorId: pickNumber(instructor, ["id"], 0) || null,
    isFeatured: pickBoolean(record, "is_featured"),
  };
}

function normalizeCourseDetail(raw: unknown): StudentPortalCourseDetail | null {
  const record = getRecord(raw);
  if (!record) return null;

  const idValue = record.id;
  if (typeof idValue !== "number" && typeof idValue !== "string") {
    return null;
  }

  const instructor =
    getRecord(record.primary_instructor) ??
    getRecord(record.instructor) ??
    null;
  const assets = Array.isArray(record.assets) ? record.assets : [];
  const lessons = assets
    .map((asset) => pickString(getRecord(asset), ["title", "name"]))
    .filter((value) => value.length > 0);
  const resources = Array.isArray(record.resources)
    ? record.resources
        .map((resource) =>
          pickString(getRecord(resource), ["title", "name", "label"]),
        )
        .filter((value) => value.length > 0)
    : [];

  return {
    id: idValue,
    centerId: pickNumber(record, ["center_id"], 0) || null,
    title: pickString(record, ["title", "name"], "Course"),
    description: pickString(record, ["description", "short_description"]),
    progress: pickNumber(record, [
      "progress_percentage",
      "progress",
      "completion_percentage",
    ]),
    lessonsCountLabel: String(
      pickNumber(record, ["lessons_count", "videos_count", "assets_count"], 0),
    ),
    durationLabel:
      pickString(record, ["duration_text", "estimated_duration"]) || "—",
    instructorName: pickString(instructor, ["name"]) || null,
    instructorRole: pickString(instructor, ["title", "role"]) || null,
    resources,
    lessons,
  };
}

function normalizeCategory(raw: unknown): StudentPortalCategory | null {
  const record = getRecord(raw);
  if (!record) return null;
  const idValue = record.id;
  if (typeof idValue !== "number" && typeof idValue !== "string") {
    return null;
  }

  return {
    id: idValue,
    title: pickString(record, ["title", "name"], "Category"),
  };
}

export async function listStudentExploreCourses(
  params: StudentPortalCourseListParams,
): Promise<StudentPortalCourseListResponse> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(
    "/api/v1/web/courses/explore",
    { params },
  );

  return {
    items: (data.data ?? [])
      .map((item) => normalizeCourseSummary(item))
      .filter((item): item is StudentPortalCourseSummary => item != null),
    meta: {
      page: data.meta?.page ?? params.page ?? 1,
      per_page: data.meta?.per_page ?? params.per_page ?? 15,
      total: data.meta?.total ?? 0,
    },
  };
}

export async function listStudentEnrolledCourses(
  params: StudentPortalCourseListParams,
): Promise<StudentPortalCourseListResponse> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(
    "/api/v1/web/courses/enrolled",
    { params },
  );

  return {
    items: (data.data ?? [])
      .map((item) => normalizeCourseSummary(item))
      .filter((item): item is StudentPortalCourseSummary => item != null),
    meta: {
      page: data.meta?.page ?? params.page ?? 1,
      per_page: data.meta?.per_page ?? params.per_page ?? 15,
      total: data.meta?.total ?? 0,
    },
  };
}

export async function listStudentCategories(
  centerId?: string | number | null,
): Promise<StudentPortalCategory[]> {
  const path =
    centerId != null && centerId !== ""
      ? `/api/v1/web/centers/${centerId}/categories`
      : "/api/v1/web/categories";

  const { data } = await portalHttp.get<RawPortalResponse<unknown[]>>(path, {
    params: { per_page: 50 },
  });

  return (data.data ?? [])
    .map((item) => normalizeCategory(item))
    .filter((item): item is StudentPortalCategory => item != null);
}

export async function getStudentCourseDetail(
  centerId: string | number,
  courseId: string | number,
): Promise<StudentPortalCourseDetail | null> {
  const { data } = await portalHttp.get<RawPortalResponse<unknown>>(
    `/api/v1/web/centers/${centerId}/courses/${courseId}`,
  );

  return normalizeCourseDetail(data.data);
}

export async function getStudentWeeklyActivity(
  centerId: string | number,
  days = 7,
): Promise<StudentPortalWeeklyActivity | null> {
  const { data } = await portalHttp.get<
    RawPortalResponse<{
      range?: {
        days?: number;
        timezone?: string;
        start_date?: string;
        end_date?: string;
      };
      series?: Array<{
        date?: string;
        watch_duration_seconds?: number;
        quiz_attempts_count?: number;
        assignment_submissions_count?: number;
      }>;
      totals?: {
        watch_duration_seconds?: number;
        quiz_attempts_count?: number;
        assignment_submissions_count?: number;
      };
    }>
  >(`/api/v1/web/centers/${centerId}/activity/weekly`, {
    params: { days },
  });

  if (!data.data) return null;

  return {
    range: {
      days: data.data.range?.days ?? days,
      timezone: data.data.range?.timezone ?? null,
      startDate: data.data.range?.start_date ?? null,
      endDate: data.data.range?.end_date ?? null,
    },
    series: (data.data.series ?? []).map((entry) => ({
      date: entry.date ?? "",
      watchDurationSeconds: entry.watch_duration_seconds ?? 0,
      quizAttemptsCount: entry.quiz_attempts_count ?? 0,
      assignmentSubmissionsCount: entry.assignment_submissions_count ?? 0,
    })),
    totals: {
      watchDurationSeconds: data.data.totals?.watch_duration_seconds ?? 0,
      quizAttemptsCount: data.data.totals?.quiz_attempts_count ?? 0,
      assignmentSubmissionsCount:
        data.data.totals?.assignment_submissions_count ?? 0,
    },
  };
}

export async function getStudentProfileDetails(): Promise<StudentPortalProfileDetails | null> {
  const { data } = await portalHttp.get<
    RawPortalResponse<{
      is_complete_profile?: boolean;
      profile_completion?: {
        missing_steps?: string[];
        missing_fields?: string[];
      };
    }>
  >("/api/v1/web/auth/me/profile");

  if (!data.data) return null;

  return {
    isCompleteProfile: data.data.is_complete_profile ?? false,
    missingSteps: data.data.profile_completion?.missing_steps ?? [],
    missingFields: data.data.profile_completion?.missing_fields ?? [],
  };
}
