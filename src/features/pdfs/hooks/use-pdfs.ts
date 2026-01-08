import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listPdfs, type ListPdfsParams } from "../services/pdfs.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Pdf } from "@/features/pdfs/types/pdf";

type UsePdfsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Pdf>>,
  "queryKey" | "queryFn"
>;

export function usePdfs(params: ListPdfsParams, options?: UsePdfsOptions) {
  return useQuery({
    queryKey: ["pdfs", params],
    queryFn: () => listPdfs(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
