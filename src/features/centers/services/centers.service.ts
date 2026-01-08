import { http } from "@/lib/http";
import type { Center } from "@/features/centers/types/center";
import type { PaginatedResponse } from "@/types/pagination";

export type ListCentersParams = {
  page: number;
  per_page: number;
  search?: string;
  slug?: string;
  type?: string;
  tier?: string;
  is_featured?: boolean;
  onboarding_status?: string;
  created_from?: string;
  created_to?: string;
};

type RawCentersResponse = {
  data?: Center[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawCenterResponse = {
  data?: Center;
};

export async function listCenters(
  params: ListCentersParams,
): Promise<PaginatedResponse<Center>> {
  const { data } = await http.get<RawCentersResponse>(
    "/api/v1/admin/centers",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        slug: params.slug || undefined,
        type: params.type || undefined,
        tier: params.tier || undefined,
        is_featured:
          typeof params.is_featured === "boolean"
            ? params.is_featured
            : undefined,
        onboarding_status: params.onboarding_status || undefined,
        created_from: params.created_from || undefined,
        created_to: params.created_to || undefined,
      },
    },
  );

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page,
      per_page: data?.meta?.per_page ?? params.per_page,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getCenter(
  centerIdOrSlug: string | number,
): Promise<Center | null> {
  const { data } = await http.get<RawCenterResponse>(
    `/api/v1/admin/centers/${centerIdOrSlug}`,
  );

  return data?.data ?? null;
}
