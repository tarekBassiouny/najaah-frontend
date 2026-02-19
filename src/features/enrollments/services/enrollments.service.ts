import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  BulkEnrollmentsPayload,
  BulkEnrollmentResult,
  BulkEnrollmentStatusPayload,
  CreateCenterEnrollmentPayload,
  CreateEnrollmentPayload,
  Enrollment,
  ListEnrollmentsParams,
  UpdateEnrollmentPayload,
} from "@/features/enrollments/types/enrollment";

type RawEnrollmentsResponse = {
  data?: Enrollment[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

type RawEnrollmentResponse = {
  data?: Enrollment;
};

type RawEnrollmentEnvelopeResponse = {
  success?: boolean;
  message?: string;
  data?: Enrollment;
};

type RawBulkEnrollmentResponse = {
  success?: boolean;
  message?: string;
  data?: BulkEnrollmentResult;
};

function buildEnrollmentsBasePath(centerId?: string | number | null) {
  if (centerId == null || centerId === "") {
    return "/api/v1/admin/enrollments";
  }
  return `/api/v1/admin/centers/${centerId}/enrollments`;
}

export async function listEnrollments(
  params: ListEnrollmentsParams,
  centerId?: string | number | null,
): Promise<PaginatedResponse<Enrollment>> {
  const effectiveCenterId = centerId ?? params.center_id;
  const basePath = buildEnrollmentsBasePath(effectiveCenterId);
  const includeCenterFilter = effectiveCenterId == null;

  const { data } = await http.get<RawEnrollmentsResponse>(basePath, {
    params: {
      page: params.page,
      per_page: params.per_page,
      status: params.status || undefined,
      search: params.search || undefined,
      center_id: includeCenterFilter
        ? (params.center_id ?? undefined)
        : undefined,
      course_id: params.course_id ?? undefined,
      user_id: params.user_id ?? params.student_id ?? undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
    },
  });

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getEnrollment(
  enrollmentId: string | number,
  centerId?: string | number | null,
): Promise<Enrollment | null> {
  const basePath = buildEnrollmentsBasePath(centerId);
  const { data } = await http.get<RawEnrollmentResponse>(
    `${basePath}/${enrollmentId}`,
  );
  return data?.data ?? null;
}

export async function createEnrollment(
  payload: CreateEnrollmentPayload,
  centerId?: string | number | null,
): Promise<Enrollment> {
  const basePath = buildEnrollmentsBasePath(centerId);
  const { data } = await http.post<RawEnrollmentResponse>(basePath, payload);
  return data?.data ?? (data as unknown as Enrollment);
}

export async function createCenterEnrollment(
  centerId: string | number,
  payload: CreateCenterEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await http.post<RawEnrollmentEnvelopeResponse>(
    buildEnrollmentsBasePath(centerId),
    payload,
  );

  return data?.data ?? (data as unknown as Enrollment);
}

export async function updateEnrollment(
  enrollmentId: string | number,
  payload: UpdateEnrollmentPayload,
  centerId?: string | number | null,
): Promise<Enrollment> {
  const basePath = buildEnrollmentsBasePath(centerId);
  const { data } = await http.put<RawEnrollmentResponse>(
    `${basePath}/${enrollmentId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Enrollment);
}

export async function deleteEnrollment(
  enrollmentId: string | number,
  centerId?: string | number | null,
): Promise<void> {
  const basePath = buildEnrollmentsBasePath(centerId);
  await http.delete(`${basePath}/${enrollmentId}`);
}

export async function bulkEnrollments(
  payload: BulkEnrollmentsPayload,
  centerId?: string | number | null,
): Promise<BulkEnrollmentResult> {
  const basePath = buildEnrollmentsBasePath(centerId);
  const { data } = await http.post<RawBulkEnrollmentResponse>(
    `${basePath}/bulk`,
    payload,
  );
  return data?.data ?? (data as unknown as BulkEnrollmentResult);
}

export async function bulkUpdateEnrollmentStatus(
  payload: BulkEnrollmentStatusPayload,
  centerId?: string | number | null,
): Promise<BulkEnrollmentResult> {
  const basePath = buildEnrollmentsBasePath(centerId);
  const { data } = await http.post<RawBulkEnrollmentResponse>(
    `${basePath}/bulk-status`,
    payload,
  );
  return data?.data ?? (data as unknown as BulkEnrollmentResult);
}
