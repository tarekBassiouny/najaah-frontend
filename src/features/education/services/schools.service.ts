import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  CreateSchoolPayload,
  School,
  SchoolListParams,
  SchoolLookupParams,
  UpdateSchoolPayload,
} from "@/features/education/types/education";
import { normalizeEducationTranslations } from "@/features/education/types/education";

type RawSchoolsResponse = {
  data?: School[] | { data?: School[]; meta?: Record<string, unknown> };
  meta?: {
    page?: number;
    current_page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawSchoolResponse = {
  data?: School;
};

type RawLookupResponse = {
  data?: School[];
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/schools`;
}

function normalizeSchool(value: School): School {
  return {
    ...value,
    name_translations: normalizeEducationTranslations(value.name_translations),
  };
}

function readListPayload(data: RawSchoolsResponse["data"]) {
  if (!data) {
    return {
      items: [] as School[],
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

export async function listSchools(
  centerId: string | number,
  params: SchoolListParams = {},
): Promise<PaginatedResponse<School>> {
  const { data } = await http.get<RawSchoolsResponse>(basePath(centerId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      type: params.type ?? undefined,
      is_active:
        typeof params.is_active === "boolean" ? params.is_active : undefined,
    },
  });

  const payload = readListPayload(data?.data);
  const meta = data?.meta ?? payload.meta;

  return {
    items: payload.items.map(normalizeSchool),
    meta: {
      page: Number(meta?.page ?? meta?.current_page ?? params.page ?? 1),
      per_page: Number(meta?.per_page ?? params.per_page ?? 10),
      total: Number(meta?.total ?? payload.items.length ?? 0),
    },
  };
}

export async function lookupSchools(
  centerId: string | number,
  params: SchoolLookupParams = {},
): Promise<School[]> {
  const { data } = await http.get<RawLookupResponse>(
    `${basePath(centerId)}/lookup`,
    {
      params: {
        search: params.search || undefined,
        type: params.type ?? undefined,
        is_active:
          typeof params.is_active === "boolean" ? params.is_active : undefined,
      },
    },
  );

  return (data?.data ?? []).map(normalizeSchool);
}

export async function getSchool(
  centerId: string | number,
  schoolId: string | number,
): Promise<School | null> {
  const { data } = await http.get<RawSchoolResponse>(
    `${basePath(centerId)}/${schoolId}`,
  );
  return data?.data ? normalizeSchool(data.data) : null;
}

export async function createSchool(
  centerId: string | number,
  payload: CreateSchoolPayload,
): Promise<School> {
  const { data } = await http.post<RawSchoolResponse>(
    basePath(centerId),
    payload,
  );
  const school = data?.data ?? (data as unknown as School);
  return normalizeSchool(school);
}

export async function updateSchool(
  centerId: string | number,
  schoolId: string | number,
  payload: UpdateSchoolPayload,
): Promise<School> {
  const { data } = await http.put<RawSchoolResponse>(
    `${basePath(centerId)}/${schoolId}`,
    payload,
  );
  const school = data?.data ?? (data as unknown as School);
  return normalizeSchool(school);
}

export async function deleteSchool(
  centerId: string | number,
  schoolId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId)}/${schoolId}`);
}
