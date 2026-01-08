import { http } from "@/lib/http";
import type { Permission } from "@/features/permissions/types/permission";

type RawPermissionsResponse = {
  data?: Permission[];
};

export type ListPermissionsResponse = {
  items: Permission[];
};

export async function listPermissions(): Promise<ListPermissionsResponse> {
  const { data } = await http.get<RawPermissionsResponse>(
    "/api/v1/admin/permissions",
  );

  return {
    items: data?.data ?? [],
  };
}
