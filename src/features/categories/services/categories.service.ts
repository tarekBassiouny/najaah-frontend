import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  Category,
  CreateCategoryPayload,
  ListCategoriesParams,
  UpdateCategoryPayload,
} from "@/features/categories/types/category";

type RawCategoriesResponse = {
  data?: Category[];
  meta?: {
    page?: number;
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

type RawCategoryResponse = {
  data?: Category;
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/categories`;
}

function normalizeTranslations(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  return value as Record<string, string>;
}

export async function listCategories(
  centerId: string | number,
  params: ListCategoriesParams = {},
): Promise<PaginatedResponse<Category>> {
  const { data } = await http.get<RawCategoriesResponse>(basePath(centerId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      is_active:
        typeof params.is_active === "boolean" ? params.is_active : undefined,
      parent_id: params.parent_id ?? undefined,
    },
  });

  return {
    items: (data?.data ?? []).map((item) => ({
      ...item,
      title_translations: normalizeTranslations(item.title_translations),
      description_translations: normalizeTranslations(
        item.description_translations,
      ),
    })),
    meta: {
      page: data?.meta?.page ?? data?.meta?.current_page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function getCategory(
  centerId: string | number,
  categoryId: string | number,
): Promise<Category | null> {
  const { data } = await http.get<RawCategoryResponse>(
    `${basePath(centerId)}/${categoryId}`,
  );
  return data?.data ?? null;
}

export async function createCategory(
  centerId: string | number,
  payload: CreateCategoryPayload,
): Promise<Category> {
  const { data } = await http.post<RawCategoryResponse>(
    basePath(centerId),
    payload,
  );
  return data?.data ?? (data as unknown as Category);
}

export async function updateCategory(
  centerId: string | number,
  categoryId: string | number,
  payload: UpdateCategoryPayload,
): Promise<Category> {
  const { data } = await http.put<RawCategoryResponse>(
    `${basePath(centerId)}/${categoryId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Category);
}

export async function deleteCategory(
  centerId: string | number,
  categoryId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId)}/${categoryId}`);
}
