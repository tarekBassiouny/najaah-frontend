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

export type CenterOption = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
};

export type ListCenterOptionsParams = {
  page: number;
  per_page: number;
  search?: string;
  type?: string;
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

type RawCenterOption = {
  id?: string | number;
  center_id?: string | number;
  name?: string | null;
  center_name?: string | null;
  slug?: string | null;
  center_slug?: string | null;
};

type RawCenterOptionsMeta = {
  page?: number | string;
  current_page?: number | string;
  per_page?: number | string;
  total?: number | string;
  last_page?: number | string;
  next_page_url?: string | null;
};

type RawCenterOptionsNode = {
  data?: RawCenterOption[] | unknown;
  items?: RawCenterOption[] | unknown;
  meta?: RawCenterOptionsMeta;
  page?: number | string;
  current_page?: number | string;
  per_page?: number | string;
  total?: number | string;
  last_page?: number | string;
  next_page_url?: string | null;
  [key: string]: unknown;
};

type RawCenterOptionsResponse = {
  data?: RawCenterOption[] | RawCenterOptionsNode;
  payload?: RawCenterOptionsNode;
  meta?: RawCenterOptionsMeta;
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toCenterOption(value: unknown): CenterOption | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const id = record.id ?? record.center_id;
  if (id == null) return null;

  return {
    id: id as string | number,
    name:
      typeof record.name === "string"
        ? record.name
        : typeof record.center_name === "string"
          ? record.center_name
          : null,
    slug:
      typeof record.slug === "string"
        ? record.slug
        : typeof record.center_slug === "string"
          ? record.center_slug
          : null,
  };
}

export async function listCenters(
  params: ListCentersParams,
): Promise<PaginatedResponse<Center>> {
  const { data } = await http.get<RawCentersResponse>("/api/v1/admin/centers", {
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
  });

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page,
      per_page: data?.meta?.per_page ?? params.per_page,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function listCenterOptions(
  params: ListCenterOptionsParams,
): Promise<PaginatedResponse<CenterOption>> {
  const { data } = await http.get<RawCenterOptionsResponse>(
    "/api/v1/admin/centers/options",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        type: params.type || undefined,
      },
    },
  );

  const root = asRecord(data) ?? {};
  const payload = asRecord(root.data) ?? asRecord(root.payload) ?? root;
  const itemsSource = Array.isArray(root.data)
    ? root.data
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(root.items)
          ? root.items
          : [];
  const items = itemsSource
    .map((item) => toCenterOption(item))
    .filter((item): item is CenterOption => Boolean(item));

  const metaSource =
    (asRecord(payload.meta) as RawCenterOptionsMeta | null) ??
    (asRecord(root.meta) as RawCenterOptionsMeta | null) ??
    (payload as RawCenterOptionsMeta);

  const page =
    toNumber(metaSource?.page ?? metaSource?.current_page ?? payload.page) ??
    params.page;
  const perPage =
    toNumber(metaSource?.per_page ?? payload.per_page) ?? params.per_page;
  const totalFromMeta = toNumber(metaSource?.total ?? payload.total);
  const lastPage = toNumber(metaSource?.last_page ?? payload.last_page);
  const hasNextFromUrl = Boolean(
    metaSource?.next_page_url ?? payload.next_page_url,
  );

  const inferredTotal =
    totalFromMeta ??
    (lastPage != null
      ? lastPage * perPage
      : hasNextFromUrl
        ? page * perPage + 1
        : (page - 1) * perPage + items.length);

  return {
    items,
    meta: {
      page,
      per_page: perPage,
      total: inferredTotal,
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

export async function createCenter(
  payload: CreateCenterPayload,
): Promise<Center> {
  const { data } = await http.post<RawCenterResponse>(
    "/api/v1/admin/centers",
    payload,
  );
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

export async function restoreCenter(
  centerId: string | number,
): Promise<Center> {
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
