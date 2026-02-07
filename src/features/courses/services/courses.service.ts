import { http } from "@/lib/http";
import type {
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
      meta.current_page ?? dataNode?.current_page ?? container.current_page,
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

export async function deleteCourse(id: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/courses/${id}`);
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
        center_id: params.center_id ?? undefined,
        category_id: params.category_id ?? undefined,
        primary_instructor_id: params.primary_instructor_id ?? undefined,
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
  return (data?.data ?? data) as Course;
}

export async function createCenterCourse(
  centerId: string | number,
  payload: CreateCoursePayload,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses`,
    payload,
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
): Promise<void> {
  await http.delete(`/api/v1/admin/centers/${centerId}/courses/${courseId}`);
}

export async function cloneCourse(courseId: string | number): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/courses/${courseId}/clone`,
  );
  return (data?.data ?? data) as Course;
}

export async function publishCourse(
  courseId: string | number,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/courses/${courseId}/publish`,
  );
  return (data?.data ?? data) as Course;
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
  courseId: string | number,
  payload: CourseInstructorPayload,
) {
  const { data } = await http.post(
    `/api/v1/admin/courses/${courseId}/instructors`,
    payload,
  );
  return data;
}

export async function removeCourseInstructor(
  courseId: string | number,
  instructorId: string | number,
) {
  const { data } = await http.delete(
    `/api/v1/admin/courses/${courseId}/instructors/${instructorId}`,
  );
  return data;
}

export type CloneCourseOptions = {
  include_sections?: boolean;
  include_videos?: boolean;
  include_pdfs?: boolean;
};

export async function cloneCourseWithOptions(
  courseId: string | number,
  options?: CloneCourseOptions,
): Promise<Course> {
  const { data } = await http.post<RawResponse>(
    `/api/v1/admin/courses/${courseId}/clone`,
    { options },
  );
  return (data?.data ?? data) as Course;
}
