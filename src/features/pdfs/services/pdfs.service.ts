import { http } from "@/lib/http";
import type { Pdf, PdfUploadSession } from "@/features/pdfs/types/pdf";
import type { PaginatedResponse } from "@/types/pagination";

export type ListPdfsParams = {
  centerId?: string | number;
  page?: number;
  per_page?: number;
  search?: string;
};

export type CreatePdfPayload = {
  title?: string;
  description?: string;
  url?: string;
  file_size?: number | string;
  [key: string]: unknown;
};

export type UpdatePdfPayload = Partial<CreatePdfPayload> & {
  status?: string;
};

type RawPdfsResponse = {
  data?: Pdf[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawPdfResponse = {
  data?: Pdf;
};

type RawUploadSessionResponse = {
  data?: PdfUploadSession;
};

function basePath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/pdfs`;
}

export async function listPdfs(
  params: ListPdfsParams,
): Promise<PaginatedResponse<Pdf>> {
  if (!params.centerId) {
    throw new Error("centerId is required to list pdfs");
  }
  const { data } = await http.get<RawPdfsResponse>(basePath(params.centerId), {
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

export async function getPdf(
  centerId: string | number,
  pdfId: string | number,
): Promise<Pdf> {
  const { data } = await http.get<RawPdfResponse>(
    `${basePath(centerId)}/${pdfId}`,
  );
  return data?.data ?? (data as unknown as Pdf);
}

export async function createPdf(
  centerId: string | number,
  payload: CreatePdfPayload,
): Promise<Pdf> {
  const { data } = await http.post<RawPdfResponse>(
    basePath(centerId),
    payload,
  );
  return data?.data ?? (data as unknown as Pdf);
}

export async function updatePdf(
  centerId: string | number,
  pdfId: string | number,
  payload: UpdatePdfPayload,
): Promise<Pdf> {
  const { data } = await http.put<RawPdfResponse>(
    `${basePath(centerId)}/${pdfId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Pdf);
}

export async function deletePdf(
  centerId: string | number,
  pdfId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId)}/${pdfId}`);
}

export async function createPdfUploadSession(
  centerId: string | number,
  payload: Record<string, unknown> = {},
): Promise<PdfUploadSession> {
  const { data } = await http.post<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions`,
    payload,
  );
  return data?.data ?? (data as unknown as PdfUploadSession);
}

export async function finalizePdfUploadSession(
  centerId: string | number,
  uploadSessionId: string | number,
): Promise<PdfUploadSession> {
  const { data } = await http.post<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions/${uploadSessionId}/finalize`,
  );
  return data?.data ?? (data as unknown as PdfUploadSession);
}
