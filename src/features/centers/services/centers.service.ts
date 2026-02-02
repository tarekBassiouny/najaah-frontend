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

export type CenterAdminPayload = {
  name: string;
  email: string;
  [key: string]: unknown;
};

export type CenterBrandingPayload = {
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  [key: string]: unknown;
};

export type CreateCenterPayload = {
  name: string;
  slug?: string;
  type?: string;
  tier?: string;
  is_featured?: boolean;
  onboarding_status?: string;
  branding_metadata?: CenterBrandingPayload;
  admin?: CenterAdminPayload;
  [key: string]: unknown;
};

export type UpdateCenterPayload = Partial<CreateCenterPayload> & {
  status?: string;
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

export async function createCenter(payload: CreateCenterPayload): Promise<Center> {
  const { data } = await http.post<RawCenterResponse>("/api/v1/admin/centers", payload);
  return data?.data ?? (data as unknown as Center);
}

export async function updateCenter(
  centerId: string | number,
  payload: UpdateCenterPayload,
): Promise<Center> {
  const { data } = await http.put<RawCenterResponse>(
    `/api/v1/admin/centers/${centerId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Center);
}

export async function deleteCenter(centerId: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/centers/${centerId}`);
}

export async function restoreCenter(centerId: string | number): Promise<Center> {
  const { data } = await http.post<RawCenterResponse>(
    `/api/v1/admin/centers/${centerId}/restore`,
  );
  return data?.data ?? (data as unknown as Center);
}

export async function retryCenterOnboarding(centerId: string | number) {
  const { data } = await http.post(
    `/api/v1/admin/centers/${centerId}/onboarding/retry`,
  );
  return data;
}

export type UploadCenterLogoPayload = {
  file: File | Blob;
  filename?: string;
};

export async function uploadCenterLogo(
  centerId: string | number,
  payload: UploadCenterLogoPayload,
) {
  const formData = new FormData();
  formData.append("logo", payload.file, payload.filename);

  const { data } = await http.post(
    `/api/v1/admin/centers/${centerId}/branding/logo`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
}
