import { http } from "@/lib/http";
import type {
  Student,
  StudentImportResult,
} from "@/features/students/types/student";
import type { PaginatedResponse } from "@/types/pagination";

export type StudentsApiScopeContext = {
  centerId?: string | number | null;
};

function normalizeScopeCenterId(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildStudentsBasePath(centerId?: string | number | null) {
  const normalized = normalizeScopeCenterId(centerId);
  if (normalized == null) return "/api/v1/admin/students";
  return `/api/v1/admin/centers/${normalized}/students`;
}

export type ListStudentsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  center_id?: number | string;
  status?: string | number;
  course_id?: number | string;
  type?: "branded" | "unbranded" | 0 | 1;
};

type RawStudentsResponse = {
  data?: Student[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawStudentResponse = {
  data?: Student;
};

type RawImportResponse = {
  data?: StudentImportResult;
};

export async function listStudents(
  params: ListStudentsParams,
  context?: StudentsApiScopeContext,
): Promise<PaginatedResponse<Student>> {
  const scopeCenterId = normalizeScopeCenterId(
    context?.centerId ?? params.center_id ?? null,
  );
  const basePath = buildStudentsBasePath(scopeCenterId);
  const includeCenterFilter = scopeCenterId == null;

  const { data } = await http.get<RawStudentsResponse>(basePath, {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      center_id: includeCenterFilter
        ? (params.center_id ?? undefined)
        : undefined,
      status: params.status ?? undefined,
      course_id: params.course_id ?? undefined,
      type: params.type ?? undefined,
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

export async function getStudent(
  studentId: string | number,
  context?: StudentsApiScopeContext,
): Promise<Student | null> {
  const basePath = buildStudentsBasePath(context?.centerId);
  const { data } = await http.get<RawStudentResponse>(
    `${basePath}/${studentId}`,
  );
  return data?.data ?? null;
}

export type CreateStudentPayload = {
  name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  password?: string;
  center_id?: string | number | null;
  status?: number;
  [key: string]: unknown;
};

export type UpdateStudentPayload = {
  name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  password?: string;
  center_id?: string | number | null;
  status?: string | number;
  [key: string]: unknown;
};

export async function createStudent(
  payload: CreateStudentPayload,
  context?: StudentsApiScopeContext,
): Promise<Student> {
  const basePath = buildStudentsBasePath(context?.centerId);
  const { data } = await http.post<RawStudentResponse>(basePath, payload);
  return data?.data ?? (data as unknown as Student);
}

export async function updateStudent(
  studentId: string | number,
  payload: UpdateStudentPayload,
  context?: StudentsApiScopeContext,
): Promise<Student> {
  const basePath = buildStudentsBasePath(context?.centerId);
  const { data } = await http.put<RawStudentResponse>(
    `${basePath}/${studentId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Student);
}

export async function deleteStudent(
  studentId: string | number,
  context?: StudentsApiScopeContext,
): Promise<void> {
  const basePath = buildStudentsBasePath(context?.centerId);
  await http.delete(`${basePath}/${studentId}`);
}

export type UpdateStudentStatusPayload = {
  status: string | number;
  reason?: string;
};

export type BulkEnrollStudentsPayload = {
  center_id: string | number;
  course_id: string | number;
  user_ids: Array<string | number>;
};

export type BulkEnrollStudentsResult = {
  counts?: {
    total?: number;
    approved?: number;
    skipped?: number;
    failed?: number;
  };
  approved?: unknown[];
  skipped?: Array<string | number>;
  failed?: Array<{ user_id?: string | number; reason?: string }>;
};

export type BulkStudentStatusPayload = {
  status: string | number;
  student_ids: Array<string | number>;
};

export type BulkStudentStatusResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
  };
  updated?: unknown[];
  skipped?: Array<string | number>;
  failed?: Array<{ student_id?: string | number; reason?: string }>;
};

export async function updateStudentStatus(
  studentId: string | number,
  payload: UpdateStudentStatusPayload,
  context?: StudentsApiScopeContext,
): Promise<Student> {
  const basePath = buildStudentsBasePath(context?.centerId);
  const { data } = await http.put<RawStudentResponse>(
    `${basePath}/${studentId}/status`,
    payload,
  );
  return data?.data ?? (data as unknown as Student);
}

export async function bulkEnrollStudents(
  payload: BulkEnrollStudentsPayload,
): Promise<BulkEnrollStudentsResult> {
  const { data } = await http.post("/api/v1/admin/enrollments/bulk", payload);
  return (data?.data ?? data) as BulkEnrollStudentsResult;
}

export async function bulkUpdateStudentStatus(
  payload: BulkStudentStatusPayload,
  context?: StudentsApiScopeContext,
): Promise<BulkStudentStatusResult> {
  const basePath = buildStudentsBasePath(context?.centerId);
  const { data } = await http.post(`${basePath}/bulk-status`, payload);
  return (data?.data ?? data) as BulkStudentStatusResult;
}

export async function resetStudentDevice(
  studentId: string | number,
  context?: StudentsApiScopeContext,
): Promise<Student> {
  const basePath = buildStudentsBasePath(context?.centerId);
  const { data } = await http.post<RawStudentResponse>(
    `${basePath}/${studentId}/reset-device`,
  );
  return data?.data ?? (data as unknown as Student);
}

export async function importStudents(
  centerId: string | number,
  file: File,
): Promise<StudentImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("center_id", String(centerId));

  const { data } = await http.post<RawImportResponse>(
    "/api/v1/admin/students/import",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data?.data ?? (data as unknown as StudentImportResult);
}

export async function exportStudents(
  params: ListStudentsParams,
): Promise<Blob> {
  const response = await http.get("/api/v1/admin/students/export", {
    params: {
      center_id: params.center_id ?? undefined,
      status: params.status ?? undefined,
      search: params.search || undefined,
    },
    responseType: "blob",
  });
  return response.data;
}
