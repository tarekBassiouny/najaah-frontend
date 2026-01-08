import { http } from "@/lib/http";
import type { Instructor } from "@/features/instructors/types/instructor";
import type { PaginatedResponse } from "@/types/pagination";

export type ListInstructorsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  center_id?: number | string;
  status?: string;
};

type RawInstructorsResponse = {
  data?: Instructor[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listInstructors(
  params: ListInstructorsParams,
): Promise<PaginatedResponse<Instructor>> {
  const { data } = await http.get<RawInstructorsResponse>(
    "/api/v1/admin/instructors",
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
