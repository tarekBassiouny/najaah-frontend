import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listCenters,
  type ListCentersParams,
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
