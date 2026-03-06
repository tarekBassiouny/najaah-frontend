import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  College,
  CollegeListParams,
  CollegeLookupParams,
  CreateCollegePayload,
  UpdateCollegePayload,
} from "@/features/education/types/education";
import {
  createCollege,
  deleteCollege,
  getCollege,
  listColleges,
  lookupColleges,
  updateCollege,
} from "@/features/education/services/colleges.service";

export const collegeKeys = {
  all: ["education", "colleges"] as const,
  list: (centerId: string | number | undefined, params: CollegeListParams) =>
    [...collegeKeys.all, "list", centerId ?? null, params] as const,
  lookup: (
    centerId: string | number | undefined,
    params: CollegeLookupParams = {},
  ) => [...collegeKeys.all, "lookup", centerId ?? null, params] as const,
  details: () => [...collegeKeys.all, "detail"] as const,
  detail: (
    centerId: string | number | undefined,
    collegeId: string | number | undefined,
  ) => [...collegeKeys.details(), centerId ?? null, collegeId ?? null] as const,
};

type UseCollegesOptions = Omit<
  UseQueryOptions<PaginatedResponse<College>>,
  "queryKey" | "queryFn"
>;

type UseCollegeOptions = Omit<
  UseQueryOptions<College | null>,
  "queryKey" | "queryFn"
>;

type UseCollegeLookupOptions = Omit<
  UseQueryOptions<College[]>,
  "queryKey" | "queryFn"
>;

export function useColleges(
  centerId: string | number | undefined,
  params: CollegeListParams = {},
  options?: UseCollegesOptions,
) {
  return useQuery({
    queryKey: collegeKeys.list(centerId, params),
    queryFn: () => listColleges(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCollegeLookup(
  centerId: string | number | undefined,
  params: CollegeLookupParams = {},
  options?: UseCollegeLookupOptions,
) {
  return useQuery({
    queryKey: collegeKeys.lookup(centerId, params),
    queryFn: () => lookupColleges(centerId!, params),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCollege(
  centerId: string | number | undefined,
  collegeId: string | number | undefined,
  options?: UseCollegeOptions,
) {
  return useQuery({
    queryKey: collegeKeys.detail(centerId, collegeId),
    queryFn: () => getCollege(centerId!, collegeId!),
    enabled: !!centerId && !!collegeId,
    ...options,
  });
}

export function useCreateCollege() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateCollegePayload;
    }) => createCollege(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...collegeKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...collegeKeys.all, "lookup", centerId],
      });
    },
  });
}

export function useUpdateCollege() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      collegeId,
      payload,
    }: {
      centerId: string | number;
      collegeId: string | number;
      payload: UpdateCollegePayload;
    }) => updateCollege(centerId, collegeId, payload),
    onSuccess: (_, { centerId, collegeId }) => {
      queryClient.invalidateQueries({
        queryKey: [...collegeKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...collegeKeys.all, "lookup", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: collegeKeys.detail(centerId, collegeId),
      });
    },
  });
}

export function useDeleteCollege() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      collegeId,
    }: {
      centerId: string | number;
      collegeId: string | number;
    }) => deleteCollege(centerId, collegeId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: [...collegeKeys.all, "list", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: [...collegeKeys.all, "lookup", centerId],
      });
    },
  });
}
