import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getLearningAsset,
  listLearningAssets,
  updateLearningAsset,
  updateLearningAssetStatus,
} from "@/features/learning-assets/services/learning-assets.service";
import type {
  LearningAssetAdminResource,
  ListLearningAssetsQuery,
  ListLearningAssetsResponse,
  UpdateLearningAssetPayload,
  UpdateLearningAssetStatusPayload,
} from "@/features/learning-assets/types/learning-asset";

type UseLearningAssetsOptions = Omit<
  UseQueryOptions<ListLearningAssetsResponse>,
  "queryKey" | "queryFn"
>;

export function useLearningAssets(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  query: ListLearningAssetsQuery = {},
  options?: UseLearningAssetsOptions,
) {
  return useQuery({
    queryKey: ["learning-assets", centerId, courseId, query],
    queryFn: () => listLearningAssets(centerId!, courseId!, query),
    enabled: Boolean(centerId && courseId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseLearningAssetOptions = Omit<
  UseQueryOptions<LearningAssetAdminResource>,
  "queryKey" | "queryFn"
>;

export function useLearningAsset(
  centerId: string | number | undefined,
  assetId: string | number | undefined,
  options?: UseLearningAssetOptions,
) {
  return useQuery({
    queryKey: ["learning-asset", centerId, assetId],
    queryFn: () => getLearningAsset(centerId!, assetId!),
    enabled: Boolean(centerId && assetId),
    ...options,
  });
}

export function useUpdateLearningAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      assetId,
      payload,
    }: {
      centerId: string | number;
      assetId: string | number;
      payload: UpdateLearningAssetPayload;
    }) => updateLearningAsset(centerId, assetId, payload),
    onSuccess: (_, { centerId, assetId }) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-asset", centerId, assetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learning-assets", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-catalog", centerId],
      });
    },
  });
}

export function useUpdateLearningAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      assetId,
      payload,
    }: {
      centerId: string | number;
      assetId: string | number;
      payload: UpdateLearningAssetStatusPayload;
    }) => updateLearningAssetStatus(centerId, assetId, payload),
    onSuccess: (_, { centerId, assetId }) => {
      queryClient.invalidateQueries({
        queryKey: ["learning-asset", centerId, assetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["learning-assets", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-catalog", centerId],
      });
    },
  });
}
