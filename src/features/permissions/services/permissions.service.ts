import { http } from "@/lib/http";
import type { Permission } from "@/features/permissions/types/permission";
import type { PaginatedMeta, PaginatedResponse } from "@/types/pagination";

export type ListPermissionsParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

type RawPermissionsMeta = {
  page?: number;
  per_page?: number;
  total?: number;
  current_page?: number;
  last_page?: number;
};

type RawPermissionsResponse = {
  data?:
    | Permission[]
    | {
        data?: Permission[];
        meta?: RawPermissionsMeta;
      };
  meta?: RawPermissionsMeta;
};

export type ListPermissionsResponse = PaginatedResponse<Permission>;

function normalizeMeta(
  rawMeta: RawPermissionsMeta | undefined,
  fallbackPage: number,
  fallbackPerPage: number,
  fallbackTotal: number,
): PaginatedMeta {
  const page = rawMeta?.page ?? rawMeta?.current_page ?? fallbackPage;
  const per_page = rawMeta?.per_page ?? fallbackPerPage;
  const total = rawMeta?.total ?? fallbackTotal;

  return {
    page,
    per_page,
    total,
  };
}

export async function listPermissions(
  params: ListPermissionsParams = {},
): Promise<ListPermissionsResponse> {
  const page = params.page ?? 1;
  const perPage = params.per_page ?? 20;

  const { data } = await http.get<RawPermissionsResponse>(
    "/api/v1/admin/permissions",
    {
      params: {
        page,
        per_page: perPage,
        search: params.search || undefined,
      },
    },
  );

  const payload =
    data?.data && !Array.isArray(data.data) && typeof data.data === "object"
      ? data.data
      : undefined;

  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  const meta = normalizeMeta(
    payload?.meta ?? data?.meta,
    page,
    perPage,
    items.length,
  );

  return {
    items,
    meta,
  };
}
