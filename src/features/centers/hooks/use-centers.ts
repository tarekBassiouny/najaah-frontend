import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  bulkDeleteCenters,
  bulkRestoreCenters,
  bulkRetryCenterOnboarding,
  bulkUpdateCenterFeatured,
  bulkUpdateCenterStatus,
  bulkUpdateCenterTier,
  createCenter,
  deleteCenter,
  getCenter,
  listCenters,
  restoreCenter,
  retryCenterOnboarding,
  updateCenter,
  updateCenterStatus,
  uploadCenterLogo,
  type BulkCenterIdsPayload,
  type BulkCentersActionResult,
  type BulkUpdateCenterFeaturedPayload,
  type BulkUpdateCenterStatusPayload,
  type BulkUpdateCenterTierPayload,
  type CreateCenterPayload,
  type ListCentersParams,
  type UpdateCenterStatusPayload,
  type UpdateCenterPayload,
  type UploadCenterLogoPayload,
} from "../services/centers.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Center } from "@/features/centers/types/center";

type UseCentersOptions = Omit<
  UseQueryOptions<PaginatedResponse<Center>>,
  "queryKey" | "queryFn"
>;

export function useCenters(
  params: ListCentersParams,
  options?: UseCentersOptions,
) {
  return useQuery({
    queryKey: ["centers", params],
    queryFn: () => listCenters(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseCenterOptions = Omit<
  UseQueryOptions<Center | null>,
  "queryKey" | "queryFn"
>;

export function useCenter(
  centerIdOrSlug: string | number | undefined,
  options?: UseCenterOptions,
) {
  return useQuery({
    queryKey: ["center", centerIdOrSlug],
    queryFn: () => getCenter(centerIdOrSlug!),
    enabled: !!centerIdOrSlug,
    ...options,
  });
}

export function useCreateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCenterPayload) => createCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useUpdateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateCenterPayload;
    }) => updateCenter(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useUpdateCenterStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateCenterStatusPayload;
    }) => updateCenterStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useBulkUpdateCenterStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkUpdateCenterStatusPayload,
    ): Promise<BulkCentersActionResult> => bulkUpdateCenterStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useBulkUpdateCenterFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkUpdateCenterFeaturedPayload,
    ): Promise<BulkCentersActionResult> => bulkUpdateCenterFeatured(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useBulkUpdateCenterTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkUpdateCenterTierPayload,
    ): Promise<BulkCentersActionResult> => bulkUpdateCenterTier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useBulkDeleteCenters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkCenterIdsPayload,
    ): Promise<BulkCentersActionResult> => bulkDeleteCenters(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useBulkRestoreCenters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkCenterIdsPayload,
    ): Promise<BulkCentersActionResult> => bulkRestoreCenters(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useBulkRetryCenterOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkCenterIdsPayload,
    ): Promise<BulkCentersActionResult> => bulkRetryCenterOnboarding(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useDeleteCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
    },
  });
}

export function useRestoreCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => restoreCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useRetryCenterOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => retryCenterOnboarding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}

export function useUploadCenterLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UploadCenterLogoPayload;
    }) => uploadCenterLogo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center"] });
    },
  });
}
