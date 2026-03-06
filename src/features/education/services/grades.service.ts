import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  CreateGradePayload,
  Grade,
  GradeListParams,
  GradeLookupParams,
  UpdateGradePayload,
} from "@/features/education/types/education";
import { normalizeEducationTranslations } from "@/features/education/types/education";

type RawGradesResponse = {
  data?: Grade[] | { data?: Grade[]; meta?: Record<string, unknown> };
  meta?: {
    page?: number;
    current_page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawGradeResponse = {
  data?: Grade;
};

type RawLookupResponse = {
  data?: Grade[];
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/grades`;
}

function normalizeGrade(value: Grade): Grade {
  return {
    ...value,
    name_translations: normalizeEducationTranslations(value.name_translations),
  };
}

function readListPayload(data: RawGradesResponse["data"]) {
  if (!data) {
    return {
      items: [] as Grade[],
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

export async function listGrades(
  centerId: string | number,
  params: GradeListParams = {},
): Promise<PaginatedResponse<Grade>> {
  const { data } = await http.get<RawGradesResponse>(basePath(centerId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      stage: params.stage ?? undefined,
      is_active:
        typeof params.is_active === "boolean" ? params.is_active : undefined,
    },
  });

  const payload = readListPayload(data?.data);
  const meta = data?.meta ?? payload.meta;

  return {
    items: payload.items.map(normalizeGrade),
    meta: {
      page: Number(meta?.page ?? meta?.current_page ?? params.page ?? 1),
      per_page: Number(meta?.per_page ?? params.per_page ?? 10),
      total: Number(meta?.total ?? payload.items.length ?? 0),
    },
  };
}

export async function lookupGrades(
  centerId: string | number,
  params: GradeLookupParams = {},
): Promise<Grade[]> {
  const { data } = await http.get<RawLookupResponse>(
    `${basePath(centerId)}/lookup`,
    {
      params: {
        search: params.search || undefined,
        stage: params.stage ?? undefined,
        is_active:
          typeof params.is_active === "boolean" ? params.is_active : undefined,
      },
    },
  );

  return (data?.data ?? []).map(normalizeGrade);
}

export async function getGrade(
  centerId: string | number,
  gradeId: string | number,
): Promise<Grade | null> {
  const { data } = await http.get<RawGradeResponse>(
    `${basePath(centerId)}/${gradeId}`,
  );
  return data?.data ? normalizeGrade(data.data) : null;
}

export async function createGrade(
  centerId: string | number,
  payload: CreateGradePayload,
): Promise<Grade> {
  const { data } = await http.post<RawGradeResponse>(
    basePath(centerId),
    payload,
  );
  const grade = data?.data ?? (data as unknown as Grade);
  return normalizeGrade(grade);
}

export async function updateGrade(
  centerId: string | number,
  gradeId: string | number,
  payload: UpdateGradePayload,
): Promise<Grade> {
  const { data } = await http.put<RawGradeResponse>(
    `${basePath(centerId)}/${gradeId}`,
    payload,
  );
  const grade = data?.data ?? (data as unknown as Grade);
  return normalizeGrade(grade);
}

export async function deleteGrade(
  centerId: string | number,
  gradeId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId)}/${gradeId}`);
}
