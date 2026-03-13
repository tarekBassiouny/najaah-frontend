import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getAssetCatalog } from "@/features/course-assets/services/asset-catalog.api";
import type {
  AssetCatalogQuery,
  AssetCatalogResponse,
} from "@/features/course-assets/types/asset-catalog";

type UseAssetCatalogOptions = Omit<
  UseQueryOptions<AssetCatalogResponse>,
  "queryKey" | "queryFn"
>;

export function useAssetCatalog(
  centerId: string | number | undefined,
  courseId: string | number | undefined,
  query: AssetCatalogQuery = {},
  options?: UseAssetCatalogOptions,
) {
  return useQuery({
    queryKey: ["asset-catalog", centerId, courseId, query],
    queryFn: () => getAssetCatalog(centerId!, courseId!, query),
    enabled: Boolean(centerId && courseId),
    placeholderData: (previous) => previous,
    ...options,
  });
}
