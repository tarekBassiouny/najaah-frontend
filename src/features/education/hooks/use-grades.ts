import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  CreateGradePayload,
  Grade,
  GradeListParams,
  GradeLookupParams,
  UpdateGradePayload,
} from "@/features/education/types/education";
import {
  createGrade,
  deleteGrade,
  getGrade,
  listGrades,
  lookupGrades,
  updateGrade,
} from "@/features/education/services/grades.service";

export const gradeKeys = {
  all: ["education", "grades"] as const,
  list: (centerId: string | number | undefined, params: GradeListParams) =>
    [...gradeKeys.all, "list", centerId ?? null, params] as const,
  lookup: (
    centerId: string | number | undefined,
    params: GradeLookupParams = {},
  ) => [...gradeKeys.all, "lookup", centerId ?? null, params] as const,
  details: () => [...gradeKeys.all, "detail"] as const,
  detail: (
    centerId: string | number | undefined,
    gradeId: string | number | undefined,
  ) => [...gradeKeys.details(), centerId ?? null, gradeId ?? null] as const,
};

type UseGradesOptions = Omit<
  UseQueryOptions<PaginatedResponse<Grade>>,
  "queryKey" | "queryFn"
>;

type UseGradeOptions = Omit<
  UseQueryOptions<Grade | null>,
  "queryKey" | "queryFn"
>;

type UseGradeLookupOptions = Omit<
  UseQueryOptions<Grade[]>,
  "queryKey" | "queryFn"
>;

export function useGrades(
  centerId: string | number | undefined,
  params: GradeListParams = {},
  options?: UseGradesOptions,
) {
  return useQuery({
    queryKey: gradeKeys.list(centerId, params),
    queryFn: () => listGrades(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useGradeLookup(
  centerId: string | number | undefined,
  params: GradeLookupParams = {},
  options?: UseGradeLookupOptions,
) {
  return useQuery({
    queryKey: gradeKeys.lookup(centerId, params),
    queryFn: () => lookupGrades(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useGrade(
  centerId: string | number | undefined,
  gradeId: string | number | undefined,
  options?: UseGradeOptions,
) {
  return useQuery({
    queryKey: gradeKeys.detail(centerId, gradeId),
    queryFn: () => getGrade(centerId!, gradeId!),
    enabled: !!centerId && !!gradeId,
    ...options,
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateGradePayload;
    }) => createGrade(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...gradeKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...gradeKeys.all, "lookup", centerId],
      });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      gradeId,
      payload,
    }: {
      centerId: string | number;
      gradeId: string | number;
      payload: UpdateGradePayload;
    }) => updateGrade(centerId, gradeId, payload),
    onSuccess: (_, { centerId, gradeId }) => {
      queryClient.invalidateQueries({
        queryKey: [...gradeKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...gradeKeys.all, "lookup", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: gradeKeys.detail(centerId, gradeId),
      });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      gradeId,
    }: {
      centerId: string | number;
      gradeId: string | number;
    }) => deleteGrade(centerId, gradeId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...gradeKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...gradeKeys.all, "lookup", centerId],
      });
    },
  });
}
