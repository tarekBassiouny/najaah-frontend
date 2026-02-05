import { http } from "@/lib/http";
import type {
  Student,
  StudentImportResult,
} from "@/features/students/types/student";
import type { PaginatedResponse } from "@/types/pagination";

export type ListStudentsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  center_id?: number | string;
  status?: string;
  course_id?: number | string;
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
): Promise<PaginatedResponse<Student>> {
  const { data } = await http.get<RawStudentsResponse>(
    "/api/v1/admin/students",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        center_id: params.center_id ?? undefined,
        status: params.status || undefined,
        course_id: params.course_id ?? undefined,
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

export async function getStudent(
  studentId: string | number,
): Promise<Student | null> {
  const { data } = await http.get<RawStudentResponse>(
    `/api/v1/admin/students/${studentId}`,
  );
  return data?.data ?? null;
}

export type CreateStudentPayload = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  center_id?: string | number;
  [key: string]: unknown;
};

export type UpdateStudentPayload = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  status?: string;
  [key: string]: unknown;
};

export async function createStudent(
  payload: CreateStudentPayload,
): Promise<Student> {
  const { data } = await http.post<RawStudentResponse>(
    "/api/v1/admin/students",
    payload,
  );
  return data?.data ?? (data as unknown as Student);
}

export async function updateStudent(
  studentId: string | number,
  payload: UpdateStudentPayload,
): Promise<Student> {
  const { data } = await http.put<RawStudentResponse>(
    `/api/v1/admin/students/${studentId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Student);
}

export async function deleteStudent(studentId: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/students/${studentId}`);
}

export type UpdateStudentStatusPayload = {
  status: string;
  reason?: string;
};

export async function updateStudentStatus(
  studentId: string | number,
  payload: UpdateStudentStatusPayload,
): Promise<Student> {
  const { data } = await http.put<RawStudentResponse>(
    `/api/v1/admin/students/${studentId}/status`,
    payload,
  );
  return data?.data ?? (data as unknown as Student);
}

export async function resetStudentDevice(
  studentId: string | number,
): Promise<Student> {
  const { data } = await http.post<RawStudentResponse>(
    `/api/v1/admin/students/${studentId}/reset-device`,
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
      status: params.status || undefined,
      search: params.search || undefined,
    },
    responseType: "blob",
  });
  return response.data;
}
