import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  College,
  CollegeListParams,
  CollegeLookupParams,
  CreateCollegePayload,
  UpdateCollegePayload,
} from "@/features/education/types/education";
import { normalizeEducationTranslations } from "@/features/education/types/education";

type RawCollegesResponse = {
  data?: College[] | { data?: College[]; meta?: Record<string, unknown> };
  meta?: {
    page?: number;
    current_page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawCollegeResponse = {
  data?: College;
};

type RawLookupResponse = {
  data?: College[];
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/colleges`;
}

function normalizeCollege(value: College): College {
  return {
    ...value,
    name_translations: normalizeEducationTranslations(value.name_translations),
  };
}

function readListPayload(data: RawCollegesResponse["data"]) {
  if (!data) {
    return {
      items: [] as College[],
      meta: {} as Record<string, unknown>,
    };
  }

  if (Array.isArray(data)) {
    return {
      items: data,
      meta: {},
    };
  }

  return {
    items: Array.isArray(data.data) ? data.data : [],
    meta: data.meta ?? {},
  };
}

export async function listColleges(
  centerId: string | number,
  params: CollegeListParams = {},
): Promise<PaginatedResponse<College>> {
  const { data } = await http.get<RawCollegesResponse>(basePath(centerId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      is_active:
        typeof params.is_active === "boolean" ? params.is_active : undefined,
    },
  });

  const payload = readListPayload(data?.data);
  const meta = data?.meta ?? payload.meta;

  return {
    items: payload.items.map(normalizeCollege),
    meta: {
      page: Number(meta?.page ?? meta?.current_page ?? params.page ?? 1),
      per_page: Number(meta?.per_page ?? params.per_page ?? 10),
      total: Number(meta?.total ?? payload.items.length ?? 0),
    },
  };
}

export async function lookupColleges(
  centerId: string | number,
  params: CollegeLookupParams = {},
): Promise<College[]> {
  const { data } = await http.get<RawLookupResponse>(
    `${basePath(centerId)}/lookup`,
    {
      params: {
        search: params.search || undefined,
        is_active:
          typeof params.is_active === "boolean" ? params.is_active : undefined,
      },
    },
  );

  return (data?.data ?? []).map(normalizeCollege);
}

export async function getCollege(
  centerId: string | number,
  collegeId: string | number,
): Promise<College | null> {
  const { data } = await http.get<RawCollegeResponse>(
    `${basePath(centerId)}/${collegeId}`,
  );
  return data?.data ? normalizeCollege(data.data) : null;
}

export async function createCollege(
  centerId: string | number,
  payload: CreateCollegePayload,
): Promise<College> {
  const { data } = await http.post<RawCollegeResponse>(
    basePath(centerId),
    payload,
  );
  const college = data?.data ?? (data as unknown as College);
  return normalizeCollege(college);
}

export async function updateCollege(
  centerId: string | number,
  collegeId: string | number,
  payload: UpdateCollegePayload,
): Promise<College> {
  const { data } = await http.put<RawCollegeResponse>(
    `${basePath(centerId)}/${collegeId}`,
    payload,
  );
  const college = data?.data ?? (data as unknown as College);
  return normalizeCollege(college);
}

export async function deleteCollege(
  centerId: string | number,
  collegeId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId)}/${collegeId}`);
}
