import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
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
  };
};

type RawEnrollmentResponse = {
  data?: Enrollment;
};

type RawCreateCenterEnrollmentResponse = {
  success?: boolean;
  message?: string;
  data?: Enrollment;
};

export async function listEnrollments(
  params: ListEnrollmentsParams,
): Promise<PaginatedResponse<Enrollment>> {
  const { data } = await http.get<RawEnrollmentsResponse>(
    "/api/v1/admin/enrollments",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        status: params.status || undefined,
        center_id: params.center_id ?? undefined,
        course_id: params.course_id ?? undefined,
        student_id: params.student_id ?? undefined,
      },
    },
  );

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
): Promise<Enrollment | null> {
  const { data } = await http.get<RawEnrollmentResponse>(
    `/api/v1/admin/enrollments/${enrollmentId}`,
  );
  return data?.data ?? null;
}

export async function createEnrollment(
  payload: CreateEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await http.post<RawEnrollmentResponse>(
    "/api/v1/admin/enrollments",
    payload,
  );
  return data?.data ?? (data as unknown as Enrollment);
}

export async function createCenterEnrollment(
  centerId: string | number,
  payload: CreateCenterEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await http.post<RawCreateCenterEnrollmentResponse>(
    `/api/v1/admin/centers/${centerId}/enrollments`,
    payload,
  );

  return data?.data ?? (data as unknown as Enrollment);
}

export async function updateEnrollment(
  enrollmentId: string | number,
  payload: UpdateEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await http.put<RawEnrollmentResponse>(
    `/api/v1/admin/enrollments/${enrollmentId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Enrollment);
}

export async function deleteEnrollment(
  enrollmentId: string | number,
): Promise<void> {
  await http.delete(`/api/v1/admin/enrollments/${enrollmentId}`);
}
