import axios from "axios";
import type { Pdf, PdfUploadSession } from "@/features/pdfs/types/pdf";
import type { PaginatedResponse } from "@/types/pagination";
import { http } from "@/lib/http";
import {
  normalizeAdminActionResult,
  withResponseMessage,
  type AdminActionResult,
} from "@/lib/admin-response";

export type ListPdfsParams = {
  centerId?: string | number;
  page?: number;
  per_page?: number;
  search?: string;
  course_id?: string | number;
};

export type CreatePdfPayload = {
  title_translations: Record<string, string>;
  description_translations?: Record<string, string>;
  upload_session_id?: string | number;
  source_id?: string;
  source_url?: string;
  file_extension?: string;
  file_size_kb?: number;
  [key: string]: unknown;
};

export type UpdatePdfPayload = {
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  file_size_kb?: number;
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
      course_id: params.course_id ?? undefined,
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
  const { data } = await http.post<RawPdfResponse>(basePath(centerId), payload);
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
): Promise<AdminActionResult> {
  const { data } = await http.delete(`${basePath(centerId)}/${pdfId}`);
  return normalizeAdminActionResult(data);
}

export type CreatePdfUploadSessionPayload = {
  original_filename: string;
  file_size_kb: number;
};

export async function createPdfUploadSession(
  centerId: string | number,
  payload: CreatePdfUploadSessionPayload,
): Promise<PdfUploadSession> {
  const { data } = await http.post<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions`,
    payload,
  );
  return withResponseMessage((data?.data ?? data) as PdfUploadSession, data);
}

export type FinalizePdfUploadSessionPayload = {
  pdf_id?: string | number;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  error_message?: string;
};

export async function finalizePdfUploadSession(
  centerId: string | number,
  uploadSessionId: string | number,
  payload?: FinalizePdfUploadSessionPayload,
): Promise<PdfUploadSession> {
  const { data } = await http.post<RawUploadSessionResponse>(
    `${basePath(centerId)}/upload-sessions/${uploadSessionId}/finalize`,
    payload,
  );
  return withResponseMessage((data?.data ?? data) as PdfUploadSession, data);
}

export async function uploadPdfToStorage(
  uploadEndpoint: string,
  file: File | Blob,
  requiredHeaders?: Record<string, string> | null,
): Promise<void> {
  const headers: Record<string, string> = {
    ...(requiredHeaders ?? {}),
  };

  const hasContentTypeHeader = Object.keys(headers).some(
    (key) => key.toLowerCase() === "content-type",
  );
  if (!hasContentTypeHeader) {
    headers["Content-Type"] = "application/pdf";
  }

  await axios.put(uploadEndpoint, file, {
    headers,
    withCredentials: false,
  });
}

export type PdfSignedUrlResponse = {
  url: string;
  disposition?: string;
  expires_at: string;
  expires_in: number;
};

export async function getPdfSignedUrl(
  centerId: string | number,
  pdfId: string | number,
  disposition: "inline" | "attachment" = "inline",
): Promise<PdfSignedUrlResponse> {
  const { data } = await http.get<{ data?: PdfSignedUrlResponse }>(
    `${basePath(centerId)}/${pdfId}/signed-url`,
    {
      params: { disposition },
    },
  );
  return (data?.data ?? data) as PdfSignedUrlResponse;
}
