import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  Category,
  CreateCategoryPayload,
  ListCategoriesParams,
  UpdateCategoryPayload,
} from "@/features/categories/types/category";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/features/categories/services/categories.service";

export const categoryKeys = {
  all: ["categories"] as const,
  list: (centerId: string | number | undefined, params: ListCategoriesParams) =>
    [...categoryKeys.all, centerId, params] as const,
  details: () => ["category"] as const,
  detail: (
    centerId: string | number | undefined,
    categoryId: string | number | undefined,
  ) => [...categoryKeys.details(), centerId, categoryId] as const,
};

type UseCategoriesOptions = Omit<
  UseQueryOptions<PaginatedResponse<Category>>,
  "queryKey" | "queryFn"
>;

type UseCategoryOptions = Omit<
  UseQueryOptions<Category | null>,
  "queryKey" | "queryFn"
>;

export function useCategories(
  centerId: string | number | undefined,
  params: ListCategoriesParams = {},
  options?: UseCategoriesOptions,
) {
  return useQuery({
    queryKey: categoryKeys.list(centerId, params),
    queryFn: () => listCategories(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCategory(
  centerId: string | number | undefined,
  categoryId: string | number | undefined,
  options?: UseCategoryOptions,
) {
  return useQuery({
    queryKey: categoryKeys.detail(centerId, categoryId),
    queryFn: () => getCategory(centerId!, categoryId!),
    enabled: !!centerId && !!categoryId,
    ...options,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateCategoryPayload;
    }) => createCategory(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...categoryKeys.all, centerId],
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      categoryId,
      payload,
    }: {
      centerId: string | number;
      categoryId: string | number;
      payload: UpdateCategoryPayload;
    }) => updateCategory(centerId, categoryId, payload),
    onSuccess: (_, { centerId, categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: [...categoryKeys.all, centerId],
      });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(centerId, categoryId),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      categoryId,
    }: {
      centerId: string | number;
      categoryId: string | number;
    }) => deleteCategory(centerId, categoryId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...categoryKeys.all, centerId],
      });
    },
  });
}
