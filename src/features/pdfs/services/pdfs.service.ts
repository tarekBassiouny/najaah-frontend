import axios, { type AxiosProgressEvent } from "axios";
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
  q?: string;
  status?: string | number;
  source_type?: string | number;
  source_provider?: string;
  created_from?: string;
  created_to?: string;
  course_id?: string | number;
};

export type CreatePdfPayload = {
  title_translations: Record<string, string>;
  description_translations?: Record<string, string>;
  tags?: string[];
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
  tags?: string[];
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
  const normalizedQuery = params.q?.trim() || undefined;
  const normalizedLegacySearch = params.search?.trim() || undefined;
  const normalizedProvider = params.source_provider?.trim() || undefined;
  const { data } = await http.get<RawPdfsResponse>(basePath(params.centerId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      q: normalizedQuery,
      search: normalizedQuery ? undefined : normalizedLegacySearch,
      status: params.status ?? undefined,
      source_type: params.source_type ?? undefined,
      source_provider: normalizedProvider,
      created_from: params.created_from || undefined,
      created_to: params.created_to || undefined,
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
  tags?: string[];
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
  options?: {
    signal?: AbortSignal;
    onProgress?: (_payload: {
      loaded: number;
      total: number | null;
      percentage: number;
      bytesPerSecond: number | null;
      etaSeconds: number | null;
    }) => void;
  },
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

  let previousLoaded = 0;
  let previousTimestamp = Date.now();

  const handleProgress = (event: AxiosProgressEvent) => {
    const loaded = Number(event.loaded ?? 0);
    const totalValue =
      typeof event.total === "number" && event.total > 0 ? event.total : null;
    const percentage =
      totalValue != null ? Math.min(100, (loaded / totalValue) * 100) : 0;

    const currentTimestamp = Date.now();
    const elapsedSeconds = (currentTimestamp - previousTimestamp) / 1000;
    const loadedDelta = Math.max(0, loaded - previousLoaded);
    const calculatedRate =
      elapsedSeconds > 0 ? loadedDelta / elapsedSeconds : null;
    const bytesPerSecond =
      calculatedRate && Number.isFinite(calculatedRate) && calculatedRate > 0
        ? calculatedRate
        : typeof event.rate === "number" && event.rate > 0
          ? event.rate
          : null;
    const etaSeconds =
      totalValue != null && bytesPerSecond && bytesPerSecond > 0
        ? Math.max(0, (totalValue - loaded) / bytesPerSecond)
        : null;

    previousLoaded = loaded;
    previousTimestamp = currentTimestamp;

    options?.onProgress?.({
      loaded,
      total: totalValue,
      percentage,
      bytesPerSecond,
      etaSeconds,
    });
  };

  await axios.put(uploadEndpoint, file, {
    headers,
    withCredentials: false,
    signal: options?.signal,
    onUploadProgress: options?.onProgress ? handleProgress : undefined,
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
