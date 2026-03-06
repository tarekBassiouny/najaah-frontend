import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  CreateSchoolPayload,
  School,
  SchoolListParams,
  SchoolLookupParams,
  UpdateSchoolPayload,
} from "@/features/education/types/education";
import {
  createSchool,
  deleteSchool,
  getSchool,
  listSchools,
  lookupSchools,
  updateSchool,
} from "@/features/education/services/schools.service";

export const schoolKeys = {
  all: ["education", "schools"] as const,
  list: (centerId: string | number | undefined, params: SchoolListParams) =>
    [...schoolKeys.all, "list", centerId ?? null, params] as const,
  lookup: (
    centerId: string | number | undefined,
    params: SchoolLookupParams = {},
  ) => [...schoolKeys.all, "lookup", centerId ?? null, params] as const,
  details: () => [...schoolKeys.all, "detail"] as const,
  detail: (
    centerId: string | number | undefined,
    schoolId: string | number | undefined,
  ) => [...schoolKeys.details(), centerId ?? null, schoolId ?? null] as const,
};

type UseSchoolsOptions = Omit<
  UseQueryOptions<PaginatedResponse<School>>,
  "queryKey" | "queryFn"
>;

type UseSchoolOptions = Omit<
  UseQueryOptions<School | null>,
  "queryKey" | "queryFn"
>;

type UseSchoolLookupOptions = Omit<
  UseQueryOptions<School[]>,
  "queryKey" | "queryFn"
>;

export function useSchools(
  centerId: string | number | undefined,
  params: SchoolListParams = {},
  options?: UseSchoolsOptions,
) {
  return useQuery({
    queryKey: schoolKeys.list(centerId, params),
    queryFn: () => listSchools(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useSchoolLookup(
  centerId: string | number | undefined,
  params: SchoolLookupParams = {},
  options?: UseSchoolLookupOptions,
) {
  return useQuery({
    queryKey: schoolKeys.lookup(centerId, params),
    queryFn: () => lookupSchools(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useSchool(
  centerId: string | number | undefined,
  schoolId: string | number | undefined,
  options?: UseSchoolOptions,
) {
  return useQuery({
    queryKey: schoolKeys.detail(centerId, schoolId),
    queryFn: () => getSchool(centerId!, schoolId!),
    enabled: !!centerId && !!schoolId,
    ...options,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateSchoolPayload;
    }) => createSchool(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...schoolKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...schoolKeys.all, "lookup", centerId],
      });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      schoolId,
      payload,
    }: {
      centerId: string | number;
      schoolId: string | number;
      payload: UpdateSchoolPayload;
    }) => updateSchool(centerId, schoolId, payload),
    onSuccess: (_, { centerId, schoolId }) => {
      queryClient.invalidateQueries({
        queryKey: [...schoolKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...schoolKeys.all, "lookup", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: schoolKeys.detail(centerId, schoolId),
      });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      schoolId,
    }: {
      centerId: string | number;
      schoolId: string | number;
    }) => deleteSchool(centerId, schoolId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...schoolKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...schoolKeys.all, "lookup", centerId],
      });
    },
  });
}
