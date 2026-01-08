import { http } from "@/lib/http";
import type { Pdf } from "@/features/pdfs/types/pdf";
import type { PaginatedResponse } from "@/types/pagination";

export type ListPdfsParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

type RawPdfsResponse = {
  data?: Pdf[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listPdfs(
  params: ListPdfsParams,
): Promise<PaginatedResponse<Pdf>> {
  const { data } = await http.get<RawPdfsResponse>("/api/v1/admin/pdfs", {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
    },
  });

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}
