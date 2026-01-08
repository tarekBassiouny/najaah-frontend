import { http } from "@/lib/http";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import type { PaginatedResponse } from "@/types/pagination";

export type ListAdminUsersParams = {
  page?: number;
  per_page?: number;
};

type RawAdminUsersResponse = {
  data?: AdminUser[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listAdminUsers(
  params: ListAdminUsersParams,
): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await http.get<RawAdminUsersResponse>(
    "/api/v1/admin/users",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
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
