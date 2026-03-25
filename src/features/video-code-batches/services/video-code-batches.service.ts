import { isAxiosError } from "axios";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { http } from "@/lib/http";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  CloseVideoCodeBatchPayload,
  CreateVideoCodeBatchPayload,
  DownloadedFile,
  ExpandVideoCodeBatchPayload,
  ListVideoCodeBatchRedemptionsParams,
  ListVideoCodeBatchesParams,
  SendVideoCodeBatchWhatsappCsvPayload,
  VideoCodeBatch,
  VideoCodeBatchExportPdfParams,
  VideoCodeBatchExportParams,
  VideoCodeBatchExportRecord,
  VideoCodeBatchMetadata,
  VideoCodeBatchStatistics,
  VideoCodeBatchStudentRef,
  VideoCodeBatchUserRef,
  VideoCodeRedemption,
} from "@/features/video-code-batches/types/video-code-batch";

type RawPaginatedResponse<T> = {
  data?: T[] | RawPaginatedContainer<T>;
  meta?: Record<string, unknown>;
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
};

type RawPaginatedContainer<T> = {
  data?: T[];
  meta?: Record<string, unknown>;
  page?: number;
  per_page?: number;
  total?: number;
  current_page?: number;
};

type RawItemResponse<T> = {
  data?: T;
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number")
    return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return null;
}

function asScalarId(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return asString(value);
}

function resolveEnvelopeMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as {
    message?: unknown;
    error?: { message?: unknown };
  };

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (
    record.error &&
    typeof record.error.message === "string" &&
    record.error.message.trim()
  ) {
    return record.error.message;
  }

  return fallback;
}

function assertEnvelopeSuccess(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") return;

  const record = payload as { success?: unknown };
  if (record.success === false) {
    throw new Error(resolveEnvelopeMessage(payload, fallbackMessage));
  }
}

async function resolveBlobErrorMessage(
  payload: unknown,
  fallbackMessage: string,
): Promise<string | null> {
  if (typeof Blob === "undefined" || !(payload instanceof Blob)) {
    return null;
  }

  const contentType = payload.type.trim().toLowerCase();
  if (
    contentType &&
    !contentType.includes("json") &&
    !contentType.startsWith("text/")
  ) {
    return null;
  }

  try {
    const text = (await payload.text()).trim();
    if (!text) return null;

    const parsed = JSON.parse(text);
    return resolveEnvelopeMessage(parsed, fallbackMessage);
  } catch {
    return null;
  }
}

async function rethrowRequestError(
  error: unknown,
  fallbackMessage: string,
): Promise<never> {
  if (isAxiosError(error)) {
    const blobMessage = await resolveBlobErrorMessage(
      error.response?.data,
      fallbackMessage,
    );
    throw new Error(
      blobMessage ?? getAdminApiErrorMessage(error, fallbackMessage),
      { cause: error },
    );
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(fallbackMessage);
}

async function withResolvedRequestError<T>(
  action: () => Promise<T>,
  fallbackMessage: string,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    return rethrowRequestError(error, fallbackMessage);
  }
}

function normalizeCenterId(value?: string | number | null): string {
  if (value == null || String(value).trim().length === 0) {
    throw new Error("centerId is required for video code batch endpoints");
  }

  return String(value);
}

function buildBatchesBasePath(centerId: string | number) {
  return `/api/v1/admin/centers/${normalizeCenterId(centerId)}/video-code-batches`;
}

function buildBatchBasePath(
  centerId: string | number,
  batchId: string | number,
) {
  return `/api/v1/admin/centers/${normalizeCenterId(centerId)}/code-batches/${batchId}`;
}

function normalizeUserRef(raw: unknown): VideoCodeBatchUserRef | null {
  const payload = asRecord(raw);
  if (!payload) return null;

  return {
    ...payload,
    id: asScalarId(payload.id),
    name: asString(payload.name),
  };
}

function normalizeStudentRef(raw: unknown): VideoCodeBatchStudentRef | null {
  const payload = asRecord(raw);
  if (!payload) return null;

  return {
    ...payload,
    id: asScalarId(payload.id),
    name: asString(payload.name),
    phone: asString(payload.phone),
  };
}

function normalizeExportRecord(raw: unknown): VideoCodeBatchExportRecord {
  const payload = asRecord(raw) ?? {};

  return {
    ...payload,
    id:
      typeof payload.id === "string"
        ? payload.id
        : typeof payload.id === "number" && Number.isFinite(payload.id)
          ? String(payload.id)
          : null,
    type: asString(payload.type),
    format: asString(payload.format),
    delivery_channel: asString(payload.delivery_channel),
    status: asString(payload.status),
    exported_at: asString(payload.exported_at),
    completed_at: asString(payload.completed_at),
    exported_by: normalizeUserRef(payload.exported_by),
    destination_masked: asString(payload.destination_masked),
    code_range: asString(payload.code_range),
    start_sequence: asFiniteNumber(payload.start_sequence),
    end_sequence: asFiniteNumber(payload.end_sequence),
    count: asFiniteNumber(payload.count),
    file_name: asString(payload.file_name),
    error: asString(payload.error),
  };
}

function normalizeMetadata(raw: unknown): VideoCodeBatchMetadata | null {
  const payload = asRecord(raw);
  if (!payload) return null;

  const exportsValue = Array.isArray(payload.exports)
    ? payload.exports.map((item) => normalizeExportRecord(item))
    : null;

  return {
    ...payload,
    exports: exportsValue,
  };
}

function normalizeRedemption(raw: unknown): VideoCodeRedemption {
  const payload = asRecord(raw) ?? {};
  const resolvedId = asScalarId(payload.id);

  if (resolvedId == null) {
    throw new Error("Video code redemption response missing identifier.");
  }

  return {
    ...payload,
    id: resolvedId,
    sequence_number: asFiniteNumber(payload.sequence_number),
    code: asString(payload.code),
    user: normalizeStudentRef(payload.user),
    redeemed_at: asString(payload.redeemed_at),
  };
}

function normalizeBatch(raw: unknown): VideoCodeBatch {
  const payload = asRecord(raw) ?? {};
  const resolvedId = asScalarId(payload.id);

  if (resolvedId == null) {
    throw new Error("Video code batch response missing identifier.");
  }

  return {
    ...payload,
    id: resolvedId,
    batch_code: asString(payload.batch_code),
    video_id: asScalarId(payload.video_id),
    video_title: asString(payload.video_title),
    course_id: asScalarId(payload.course_id),
    course_title: asString(payload.course_title),
    center_id: asScalarId(payload.center_id),
    quantity: asFiniteNumber(payload.quantity),
    sold_limit: asFiniteNumber(payload.sold_limit),
    redeemed_count: asFiniteNumber(payload.redeemed_count),
    view_limit_per_code: asFiniteNumber(payload.view_limit_per_code),
    status: asString(payload.status),
    status_label: asString(payload.status_label),
    generated_by: normalizeUserRef(payload.generated_by),
    generated_at: asString(payload.generated_at),
    closed_at: asString(payload.closed_at),
    closed_by: normalizeUserRef(payload.closed_by),
    metadata: normalizeMetadata(payload.metadata),
    created_at: asString(payload.created_at),
    updated_at: asString(payload.updated_at),
    available_codes: asFiniteNumber(payload.available_codes),
    redemption_rate: asFiniteNumber(payload.redemption_rate),
    can_expand: asBoolean(payload.can_expand),
    can_close: asBoolean(payload.can_close),
    remaining_redemptions: asFiniteNumber(payload.remaining_redemptions),
    invoice_amount_codes: asFiniteNumber(payload.invoice_amount_codes),
  };
}

function normalizeStatistics(raw: unknown): VideoCodeBatchStatistics {
  const payload = asRecord(raw) ?? {};

  return {
    ...payload,
    batch_id: asScalarId(payload.batch_id),
    batch_code: asString(payload.batch_code),
    total_codes: asFiniteNumber(payload.total_codes),
    redeemed_count: asFiniteNumber(payload.redeemed_count),
    available_count: asFiniteNumber(payload.available_count),
    sold_limit: asFiniteNumber(payload.sold_limit),
    redemption_rate: asFiniteNumber(payload.redemption_rate),
    status: asString(payload.status),
    first_redemption_at: asString(payload.first_redemption_at),
    last_redemption_at: asString(payload.last_redemption_at),
    exports: Array.isArray(payload.exports)
      ? payload.exports.map((item) => normalizeExportRecord(item))
      : null,
    recent_redemptions: Array.isArray(payload.recent_redemptions)
      ? payload.recent_redemptions.map((item) => normalizeRedemption(item))
      : null,
  };
}

function normalizePaginatedList<T>(
  payload: RawPaginatedResponse<T> | undefined,
  fallbackPage: number,
  fallbackPerPage: number,
  normalizeItem: (_item: unknown) => T,
): PaginatedResponse<T> {
  const rawTopLevelData = payload?.data;
  const nestedContainer = asRecord(rawTopLevelData);
  const nestedData = Array.isArray(rawTopLevelData)
    ? null
    : (nestedContainer?.data as unknown);

  const rawItems = Array.isArray(rawTopLevelData)
    ? rawTopLevelData
    : Array.isArray(nestedData)
      ? nestedData
      : [];

  const topMeta = asRecord(payload?.meta);
  const nestedMeta = asRecord(nestedContainer?.meta);
  const effectiveMeta = nestedMeta ?? topMeta ?? nestedContainer;

  const page =
    asFiniteNumber(effectiveMeta?.page) ??
    asFiniteNumber(effectiveMeta?.current_page) ??
    fallbackPage;
  const perPage =
    asFiniteNumber(effectiveMeta?.per_page) ??
    asFiniteNumber(effectiveMeta?.page_size) ??
    fallbackPerPage;
  const total = asFiniteNumber(effectiveMeta?.total) ?? rawItems.length;

  return {
    items: rawItems.map((item) => normalizeItem(item)),
    meta: {
      page,
      per_page: perPage,
      total,
    },
  };
}

function parseFilenameFromDisposition(value: string | null | undefined) {
  if (!value) return null;

  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(value);
  if (!match?.[1]) return null;

  return match[1].replace(/^['"]|['"]$/g, "").trim() || null;
}

async function downloadBatchFile(
  url: string,
  params?: Record<string, string | number | undefined>,
): Promise<DownloadedFile> {
  return withResolvedRequestError(async () => {
    const response = await http.get<Blob>(url, {
      params,
      responseType: "blob",
    });

    const contentDisposition =
      response.headers["content-disposition"] ??
      response.headers["Content-Disposition"];

    return {
      blob: response.data,
      filename: parseFilenameFromDisposition(contentDisposition),
    };
  }, "Failed to export video code batch.");
}

export async function listVideoCodeBatches(
  params: ListVideoCodeBatchesParams,
  centerId: string | number,
): Promise<PaginatedResponse<VideoCodeBatch>> {
  return withResolvedRequestError(async () => {
    const { data } = await http.get<RawPaginatedResponse<VideoCodeBatch>>(
      buildBatchesBasePath(centerId),
      {
        params: {
          page: params.page,
          per_page: params.per_page,
          course_id: params.course_id ?? undefined,
          video_id: params.video_id ?? undefined,
          status: params.status || undefined,
          search: params.search?.trim() || undefined,
        },
      },
    );

    assertEnvelopeSuccess(data, "Failed to load video code batches.");
    return normalizePaginatedList(
      data,
      params.page ?? 1,
      params.per_page ?? 15,
      normalizeBatch,
    );
  }, "Failed to load video code batches.");
}

export async function getVideoCodeBatch(
  centerId: string | number,
  batchId: string | number,
): Promise<VideoCodeBatch> {
  return withResolvedRequestError(async () => {
    const { data } = await http.get<RawItemResponse<VideoCodeBatch>>(
      buildBatchBasePath(centerId, batchId),
    );

    assertEnvelopeSuccess(data, "Failed to load video code batch.");
    return normalizeBatch(data?.data ?? data);
  }, "Failed to load video code batch.");
}

export async function getVideoCodeBatchStatistics(
  centerId: string | number,
  batchId: string | number,
): Promise<VideoCodeBatchStatistics> {
  return withResolvedRequestError(async () => {
    const { data } = await http.get<RawItemResponse<VideoCodeBatchStatistics>>(
      `${buildBatchBasePath(centerId, batchId)}/statistics`,
    );

    assertEnvelopeSuccess(data, "Failed to load video code batch statistics.");
    return normalizeStatistics(data?.data ?? data);
  }, "Failed to load video code batch statistics.");
}

export async function listVideoCodeBatchRedemptions(
  centerId: string | number,
  batchId: string | number,
  params: ListVideoCodeBatchRedemptionsParams,
): Promise<PaginatedResponse<VideoCodeRedemption>> {
  return withResolvedRequestError(async () => {
    const { data } = await http.get<RawPaginatedResponse<VideoCodeRedemption>>(
      `${buildBatchBasePath(centerId, batchId)}/redemptions`,
      {
        params: {
          page: params.page,
          per_page: params.per_page,
          search: params.search?.trim() || undefined,
        },
      },
    );

    assertEnvelopeSuccess(data, "Failed to load video code redemptions.");
    return normalizePaginatedList(
      data,
      params.page ?? 1,
      params.per_page ?? 15,
      normalizeRedemption,
    );
  }, "Failed to load video code redemptions.");
}

export async function createVideoCodeBatch(
  centerId: string | number,
  courseId: string | number,
  videoId: string | number,
  payload: CreateVideoCodeBatchPayload,
): Promise<VideoCodeBatch> {
  return withResolvedRequestError(async () => {
    const { data } = await http.post<RawItemResponse<VideoCodeBatch>>(
      `/api/v1/admin/centers/${normalizeCenterId(centerId)}/courses/${courseId}/videos/${videoId}/code-batches`,
      payload,
    );

    assertEnvelopeSuccess(data, "Failed to create video code batch.");
    return normalizeBatch(data?.data ?? data);
  }, "Failed to create video code batch.");
}

export async function expandVideoCodeBatch(
  centerId: string | number,
  batchId: string | number,
  payload: ExpandVideoCodeBatchPayload,
): Promise<VideoCodeBatch> {
  return withResolvedRequestError(async () => {
    const { data } = await http.post<RawItemResponse<VideoCodeBatch>>(
      `${buildBatchBasePath(centerId, batchId)}/expand`,
      payload,
    );

    assertEnvelopeSuccess(data, "Failed to expand video code batch.");
    return normalizeBatch(data?.data ?? data);
  }, "Failed to expand video code batch.");
}

export async function closeVideoCodeBatch(
  centerId: string | number,
  batchId: string | number,
  payload: CloseVideoCodeBatchPayload,
): Promise<VideoCodeBatch> {
  return withResolvedRequestError(async () => {
    const { data } = await http.post<RawItemResponse<VideoCodeBatch>>(
      `${buildBatchBasePath(centerId, batchId)}/close`,
      payload,
    );

    assertEnvelopeSuccess(data, "Failed to close video code batch.");
    return normalizeBatch(data?.data ?? data);
  }, "Failed to close video code batch.");
}

export async function exportVideoCodeBatchCsv(
  centerId: string | number,
  batchId: string | number,
  params?: VideoCodeBatchExportParams,
): Promise<DownloadedFile> {
  return downloadBatchFile(
    `${buildBatchBasePath(centerId, batchId)}/export/csv`,
    {
      start_sequence: params?.start_sequence,
      end_sequence: params?.end_sequence,
    },
  );
}

export async function exportVideoCodeBatchPdf(
  centerId: string | number,
  batchId: string | number,
  params?: VideoCodeBatchExportPdfParams,
): Promise<DownloadedFile> {
  return downloadBatchFile(
    `${buildBatchBasePath(centerId, batchId)}/export/pdf`,
    {
      start_sequence: params?.start_sequence,
      end_sequence: params?.end_sequence,
      cards_per_page: params?.cards_per_page,
    },
  );
}

export async function sendVideoCodeBatchWhatsappCsv(
  centerId: string | number,
  batchId: string | number,
  payload: SendVideoCodeBatchWhatsappCsvPayload,
): Promise<VideoCodeBatchExportRecord> {
  return withResolvedRequestError(async () => {
    const { data } = await http.post<
      RawItemResponse<VideoCodeBatchExportRecord>
    >(`${buildBatchBasePath(centerId, batchId)}/send-whatsapp-csv`, payload);

    assertEnvelopeSuccess(data, "Failed to send WhatsApp CSV.");
    return normalizeExportRecord(data?.data ?? data);
  }, "Failed to send WhatsApp CSV.");
}
