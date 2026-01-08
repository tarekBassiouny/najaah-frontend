import { http } from "@/lib/http";
import type { Role } from "@/features/roles/types/role";
import type { PaginatedResponse } from "@/types/pagination";

export type ListRolesParams = {
  page?: number;
  per_page?: number;
};

type RawRolesResponse = {
  data?: Role[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listRoles(
  params: ListRolesParams,
): Promise<PaginatedResponse<Role>> {
  const { data } = await http.get<RawRolesResponse>("/api/v1/admin/roles", {
    params: {
      page: params.page,
      per_page: params.per_page,
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
