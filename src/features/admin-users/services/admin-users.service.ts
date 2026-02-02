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

type RawAdminUserResponse = {
  data?: AdminUser;
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

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  phone?: string;
  center_id?: string | number | null;
  password?: string;
  [key: string]: unknown;
};

export type UpdateAdminUserPayload = Partial<CreateAdminUserPayload> & {
  status?: string;
};

export async function getAdminUser(
  userId: string | number,
): Promise<AdminUser | null> {
  const { data } = await http.get<RawAdminUserResponse>(`/api/v1/admin/users/${userId}`);
  return data?.data ?? null;
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminUser> {
  const { data } = await http.post<RawAdminUserResponse>("/api/v1/admin/users", payload);
  return data?.data ?? (data as unknown as AdminUser);
}

export async function updateAdminUser(
  userId: string | number,
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> {
  const { data } = await http.put<RawAdminUserResponse>(
    `/api/v1/admin/users/${userId}`,
    payload,
  );
  return data?.data ?? (data as unknown as AdminUser);
}

export async function deleteAdminUser(userId: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/users/${userId}`);
}

export async function syncAdminUserRoles(
  userId: string | number,
  roleIds: Array<string | number>,
) {
  const { data } = await http.put(`/api/v1/admin/users/${userId}/roles`, {
    role_ids: roleIds,
  });
  return data;
}
