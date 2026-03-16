import { http } from "@/lib/http";
import {
  normalizeAdminActionResult,
  withResponseMessage,
  type AdminActionResult,
} from "@/lib/admin-response";

import type {
  CourseAccessModel,
  Course,
  CourseSummary,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "@/features/courses/types/course";

export type ListCoursesParams = {
  page: number;
  per_page: number;
  search?: string;
  center_id?: string | number;
  category_id?: string | number;
  primary_instructor_id?: string | number;
  access_model?: CourseAccessModel;
};

export type CoursesResponse = {
  items: Array<Course | CourseSummary>;
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function extractCourseFromResponse(raw: unknown): Course {
  const payload = raw as Record<string, unknown> | undefined;
  const nestedData = payload?.data as Record<string, unknown> | undefined;
  const course =
    (payload?.course as Course | undefined) ??
    (nestedData?.course as Course | undefined) ??
    (payload?.data as Course | undefined) ??
    (payload as Course);
  return course;
}

function isBlobLike(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function appendIfPresent(
  formData: FormData,
  key: string,
  value: string | number | boolean | undefined | null,
) {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") {
    formData.append(key, value ? "1" : "0");
    return;
  }
  formData.append(key, String(value));
}

function normalizeIdArray(
  values: Array<string | number> | undefined,
): Array<string | number> {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const normalized: Array<string | number> = [];

  values.forEach((value) => {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return;
    } else if (typeof value === "string") {
      if (!value.trim()) return;
    } else {
      return;
    }

    const key = String(value).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    normalized.push(typeof value === "string" ? key : value);
  });

  return normalized;
}

function appendArrayIfPresent(
  formData: FormData,
  key: string,
  values: Array<string | number> | undefined,
) {
  const normalized = normalizeIdArray(values);
  normalized.forEach((value) => {
    formData.append(`${key}[]`, String(value));
  });
}

function toCreateCourseFormData(payload: CreateCoursePayload): FormData {
  const formData = new FormData();

  const titleTranslations = payload.title_translations ?? {};
  Object.entries(titleTranslations).forEach(([lang, value]) => {
    if (!value) return;
    formData.append(`title_translations[${lang}]`, value);
  });

  const descriptionTranslations = payload.description_translations ?? {};
  Object.entries(descriptionTranslations).forEach(([lang, value]) => {
    if (!value) return;
    formData.append(`description_translations[${lang}]`, value);
  });

  appendIfPresent(formData, "category_id", payload.category_id);
  appendIfPresent(formData, "difficulty", payload.difficulty);
  appendIfPresent(formData, "language", payload.language);
  appendIfPresent(formData, "price", payload.price);
  appendIfPresent(
    formData,
    "instructor_id",
    payload.instructor_id ?? payload.primary_instructor_id,
  );
  appendIfPresent(formData, "slug", payload.slug);
  appendIfPresent(formData, "status", payload.status);
  appendIfPresent(formData, "access_model", payload.access_model);
  appendIfPresent(
    formData,
    "requires_video_approval",
    payload.requires_video_approval,
  );
  appendIfPresent(
    formData,
    "show_for_all_students",
    payload.show_for_all_students,
  );
  appendArrayIfPresent(formData, "grade_ids", payload.grade_ids);
  appendArrayIfPresent(formData, "school_ids", payload.school_ids);
  appendArrayIfPresent(formData, "college_ids", payload.college_ids);

  if (isBlobLike(payload.thumbnail)) {
    formData.append("thumbnail", payload.thumbnail);
  }

  return formData;
}

function normalizeCoursesResponse(
  raw: RawResponse | undefined,
  fallback: ListCoursesParams,
): CoursesResponse {
  const container =
    raw && typeof raw === "object" && raw !== null ? (raw as RawResponse) : {};
  const dataNode = (container.data ?? container) as any;
  const items = Array.isArray(dataNode?.data)
    ? (dataNode.data as Array<Course | CourseSummary>)
    : Array.isArray(dataNode)
      ? (dataNode as Array<Course | CourseSummary>)
      : [];

  const meta =
    (dataNode?.meta as Record<string, unknown> | undefined) ??
    (container.meta as Record<string, unknown> | undefined) ??
    {};

  const page =
    Number(
      meta.page ??
        meta.current_page ??
        dataNode?.page ??
        dataNode?.current_page ??
        container.page ??
        container.current_page,
    ) || fallback.page;
  const perPage =
    Number(meta.per_page ?? dataNode?.per_page ?? container.per_page) ||
    fallback.per_page;
  const total =
    Number(meta.total ?? dataNode?.total ?? container.total) || items.length;
  const lastPage =
    Number(meta.last_page ?? dataNode?.last_page ?? container.last_page ?? 1) ||
    1;

  return {
    items,
    page,
    perPage,
    total,
    lastPage,
  };
}

export async function listCourses(params: ListCoursesParams) {
  const { data } = await http.get<RawResponse>("/api/v1/admin/courses", {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      center_id: params.center_id ?? undefined,
      category_id: params.category_id ?? undefined,
      primary_instructor_id: params.primary_instructor_id ?? undefined,
      access_model: params.access_model ?? undefined,
    },
  });

  return normalizeCoursesResponse(data, params);
}

export async function getCourse(id: string | number): Promise<Course> {
  const { data } = await http.get<RawResponse>(`/api/v1/admin/courses/${id}`);
  const course = (data?.data ?? data) as Course;
  return course;
}

export async function createCourse(
  payload: CreateCoursePayload,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    "/api/v1/admin/courses",
    payload,
  );
  return (data?.data ?? data) as Course;
}

export async function updateCourse(
  id: string | number,
  payload: UpdateCoursePayload,
): Promise<Course> {
  const { data } = await http.put<RawResponse>(
    `/api/v1/admin/courses/${id}`,
    payload,
  );
  return (data?.data ?? data) as Course;
}

export async function deleteCourse(
  id: string | number,
): Promise<AdminActionResult> {
  const { data } = await http.delete(`/api/v1/admin/courses/${id}`);
  return normalizeAdminActionResult(data);
}

export type ListCenterCoursesParams = Omit<ListCoursesParams, "center_id"> & {
  center_id: string | number;
};

export async function listCenterCourses(params: ListCenterCoursesParams) {
  const { data } = await http.get<RawResponse>(
    `/api/v1/admin/centers/${params.center_id}/courses`,
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        category_id: params.category_id ?? undefined,
        primary_instructor_id: params.primary_instructor_id ?? undefined,
        access_model: params.access_model ?? undefined,
      },
    },
  );

  return normalizeCoursesResponse(data, params);
}

export async function getCenterCourse(
  centerId: string | number,
  courseId: string | number,
): Promise<Course> {
  const { data } = await http.get<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}`,
  );
  return extractCourseFromResponse(data);
}

export async function createCenterCourse(
  centerId: string | number,
  payload: CreateCoursePayload,
): Promise<Course> {
  const requestData = isBlobLike(payload.thumbnail)
    ? toCreateCourseFormData(payload)
    : payload;

  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses`,
    requestData,
    isBlobLike(payload.thumbnail)
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined,
  );
  return (data?.data ?? data) as Course;
}

export async function updateCenterCourse(
  centerId: string | number,
  courseId: string | number,
  payload: UpdateCoursePayload,
): Promise<Course> {
  const { data } = await http.put<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}`,
    payload,
  );
  return (data?.data ?? data) as Course;
}

export async function deleteCenterCourse(
  centerId: string | number,
  courseId: string | number,
): Promise<AdminActionResult> {
  const { data } = await http.delete(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}`,
  );
  return normalizeAdminActionResult(data);
}

export async function cloneCourse(
  centerId: string | number,
  courseId: string | number,
  options?: CloneCourseOptions,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/clone`,
    { options: options ?? {} },
  );
  return withResponseMessage((data?.data ?? data) as Course, data);
}

export async function publishCourse(
  centerId: string | number,
  courseId: string | number,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/publish`,
  );
  return withResponseMessage((data?.data ?? data) as Course, data);
}

export async function unpublishCourse(
  centerId: string | number,
  courseId: string | number,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/unpublish`,
  );
  return withResponseMessage((data?.data ?? data) as Course, data);
}

export type CourseMediaAssignmentPayload = {
  video_id?: string | number;
  pdf_id?: string | number;
  [key: string]: unknown;
};

export async function assignCourseVideo(
  centerId: string | number,
  courseId: string | number,
  payload: CourseMediaAssignmentPayload,
) {
  const { data } = await http.post(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/videos`,
    payload,
  );
  return data;
}

export async function removeCourseVideo(
  centerId: string | number,
  courseId: string | number,
  videoId: string | number,
) {
  const { data } = await http.delete(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/videos/${videoId}`,
  );
  return data;
}

export async function assignCoursePdf(
  centerId: string | number,
  courseId: string | number,
  payload: CourseMediaAssignmentPayload,
) {
  const { data } = await http.post(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/pdfs`,
    payload,
  );
  return data;
}

export async function removeCoursePdf(
  centerId: string | number,
  courseId: string | number,
  pdfId: string | number,
) {
  const { data } = await http.delete(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/pdfs/${pdfId}`,
  );
  return data;
}

export type CourseInstructorPayload = {
  instructor_id: string | number;
  role?: string;
  [key: string]: unknown;
};

export async function assignCourseInstructor(
  centerId: string | number,
  courseId: string | number,
  payload: CourseInstructorPayload,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/instructors`,
    payload,
  );
  return withResponseMessage(extractCourseFromResponse(data), data);
}

export async function removeCourseInstructor(
  centerId: string | number,
  courseId: string | number,
  instructorId: string | number,
): Promise<Course> {
  const { data } = await http.delete<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/instructors/${instructorId}`,
  );
  return withResponseMessage(extractCourseFromResponse(data), data);
}

export type CloneCourseOptions = {
  include_sections?: boolean;
  include_videos?: boolean;
  include_pdfs?: boolean;
};

export async function cloneCourseWithOptions(
  centerId: string | number,
  courseId: string | number,
  options?: CloneCourseOptions,
): Promise<Course> {
  return cloneCourse(centerId, courseId, options);
}

export type UploadCourseThumbnailResponse = {
  success: boolean;
  message?: string;
  data?: Course;
};

export async function uploadCourseThumbnail(
  centerId: string | number,
  courseId: string | number,
  thumbnailFile: File | Blob,
): Promise<Course> {
  const formData = new FormData();
  formData.append("thumbnail", thumbnailFile);

  const { data } = await http.post<UploadCourseThumbnailResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/thumbnail`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return extractCourseFromResponse(data);
}
