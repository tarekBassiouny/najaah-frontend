import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createCenter,
  deleteCenter,
  getCenter,
  listCenters,
  restoreCenter,
  retryCenterOnboarding,
  updateCenter,
  uploadCenterLogo,
  type CreateCenterPayload,
  type ListCentersParams,
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center", id] });
    },
  });
}

export type BulkUpdateCenterStatusPayload = {
  status: string;
  center_ids: Array<string | number>;
};

export type BulkUpdateCenterStatusResult = {
  counts: {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  failed: Array<{ center_id: string | number; reason: string }>;
  skipped: Array<{ center_id: string | number; reason: string }>;
};

export function useBulkUpdateCenterStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: BulkUpdateCenterStatusPayload,
    ): Promise<BulkUpdateCenterStatusResult> => {
      const uniqueCenterIds = payload.center_ids.filter(
        (id, index, source) =>
          source.findIndex((item) => String(item) === String(id)) === index,
      );

      if (uniqueCenterIds.length === 0) {
        return {
          counts: { total: 0, updated: 0, skipped: 0, failed: 0 },
          failed: [],
          skipped: [],
        };
      }

      const settled = await Promise.allSettled(
        uniqueCenterIds.map((centerId) =>
          updateCenter(centerId, { status: payload.status }),
        ),
      );

      const failed: Array<{ center_id: string | number; reason: string }> = [];
      let updated = 0;

      settled.forEach((result, index) => {
        const centerId = uniqueCenterIds[index];

        if (result.status === "fulfilled") {
          updated += 1;
          return;
        }

        const reason =
          result.reason instanceof Error
            ? result.reason.message
            : "Unable to update center status.";

        failed.push({
          center_id: centerId,
          reason,
        });
      });

      return {
        counts: {
          total: uniqueCenterIds.length,
          updated,
          skipped: 0,
          failed: failed.length,
        },
        failed,
        skipped: [],
      };
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });

      payload.center_ids.forEach((centerId) => {
        queryClient.invalidateQueries({ queryKey: ["center", centerId] });
      });
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["centers"] });
      queryClient.invalidateQueries({ queryKey: ["center", id] });
    },
  });
}

export function useRetryCenterOnboarding() {
  return useMutation({
    mutationFn: (id: string | number) => retryCenterOnboarding(id),
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["center", id] });
    },
  });
}
