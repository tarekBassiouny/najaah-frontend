import { http } from "@/lib/http";
import type { Student } from "@/features/students/types/student";
import type { PaginatedResponse } from "@/types/pagination";

export type ListStudentsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  center_id?: number | string;
  status?: string;
};

type RawStudentsResponse = {
  data?: Student[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
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
