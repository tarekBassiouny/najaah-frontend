import { http } from "@/lib/http";
import type {
  ApproveVideoAccessRequestPayload,
  ApproveVideoAccessRequestResult,
  BulkApproveVideoAccessRequestsPayload,
  BulkRejectVideoAccessRequestsPayload,
  BulkSendVideoAccessCodesWhatsappPayload,
  BulkWhatsappJob,
  GenerateVideoAccessCodePayload,
  GeneratedVideoAccessCode,
  ListVideoAccessCodesParams,
  ListVideoAccessRequestsParams,
  RejectVideoAccessRequestPayload,
  SendVideoAccessCodeWhatsappPayload,
  VideoAccessBulkActionResult,
  VideoAccessCode,
  VideoAccessRequest,
} from "@/features/video-access/types/video-access";
import type { PaginatedResponse } from "@/types/pagination";

type RawPaginatedResponse<T> = {
  data?: T[] | RawPaginatedContainer<T>;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    current_page?: number;
  };
};

type RawPaginatedContainer<T> = {
  data?: T[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    current_page?: number;
  };
  page?: number;
  per_page?: number;
  total?: number;
  current_page?: number;
};

type RawItemResponse<T> = {
  data?: T;
  success?: boolean;
  message?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asScalarId(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const stringValue = asString(value);
  return stringValue ?? null;
}

function normalizeBulkWhatsappJob(raw: unknown): BulkWhatsappJob {
  const payload = asRecord(raw) ?? {};
  const resolvedId = asScalarId(payload.id) ?? asScalarId(payload.job_id);
  if (resolvedId == null) {
    throw new Error("Bulk WhatsApp job response missing job identifier.");
  }

  const settings = asRecord(payload.settings);
  const status = asString(payload.status);
  const statusKey = asString(payload.status_key) ?? status;

  return {
    ...payload,
    id: resolvedId,
    job_id: asScalarId(payload.job_id) ?? resolvedId,
    status,
    status_key: statusKey,
    settings,
    total_codes: asFiniteNumber(payload.total_codes),
    sent_count: asFiniteNumber(payload.sent_count),
    failed_count: asFiniteNumber(payload.failed_count),
    pending_count: asFiniteNumber(payload.pending_count),
    progress_percent: asFiniteNumber(payload.progress_percent),
    estimated_minutes: asFiniteNumber(payload.estimated_minutes),
    created_at: asString(payload.created_at),
    updated_at: asString(payload.updated_at),
  };
}

function normalizePaginatedList<T>(
  payload: RawPaginatedResponse<T> | undefined,
  fallbackPage: number,
  fallbackPerPage: number,
): PaginatedResponse<T> {
  const rawTopLevelData = payload?.data;
  const nestedContainer = asRecord(rawTopLevelData);
  const nestedData = Array.isArray(rawTopLevelData)
    ? null
    : (nestedContainer?.data as unknown);

  const items = Array.isArray(rawTopLevelData)
    ? rawTopLevelData
    : Array.isArray(nestedData)
      ? (nestedData as T[])
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
  const total = asFiniteNumber(effectiveMeta?.total) ?? items.length;

  return {
    items,
    meta: {
      page,
      per_page: perPage,
      total,
    },
  };
}

function normalizeCenterId(value?: string | number | null): string {
  if (value == null || value === "") {
    throw new Error("centerId is required for video access endpoints");
  }
  return String(value);
}

function buildRequestsBasePath(centerId?: string | number | null) {
  return `/api/v1/admin/centers/${normalizeCenterId(centerId)}/video-access-requests`;
}

function buildCodesBasePath(centerId?: string | number | null) {
  return `/api/v1/admin/centers/${normalizeCenterId(centerId)}/video-access-codes`;
}

function buildStudentsBasePath(centerId?: string | number | null) {
  return `/api/v1/admin/centers/${normalizeCenterId(centerId)}/students`;
}

function buildBulkJobsBasePath(centerId?: string | number | null) {
  return `/api/v1/admin/centers/${normalizeCenterId(centerId)}/bulk-whatsapp-jobs`;
}

export async function listVideoAccessRequests(
  params: ListVideoAccessRequestsParams,
  centerId?: string | number | null,
): Promise<PaginatedResponse<VideoAccessRequest>> {
  const effectiveCenterId = centerId ?? params.center_id;
  const basePath = buildRequestsBasePath(effectiveCenterId);

  const { data } = await http.get<RawPaginatedResponse<VideoAccessRequest>>(
    basePath,
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        status: params.status || undefined,
        user_id: params.user_id ?? undefined,
        video_id: params.video_id ?? undefined,
        course_id: params.course_id ?? undefined,
        date_from: params.date_from || undefined,
        date_to: params.date_to || undefined,
        search: params.search || undefined,
      },
    },
  );

  return normalizePaginatedList(data, params.page ?? 1, params.per_page ?? 10);
}

export async function approveVideoAccessRequest(
  requestId: string | number,
  payload: ApproveVideoAccessRequestPayload,
  centerId?: string | number | null,
): Promise<ApproveVideoAccessRequestResult> {
  const basePath = buildRequestsBasePath(centerId);
  const { data } = await http.post<
    RawItemResponse<ApproveVideoAccessRequestResult>
  >(`${basePath}/${requestId}/approve`, payload);

  return data?.data ?? (data as unknown as ApproveVideoAccessRequestResult);
}

export async function rejectVideoAccessRequest(
  requestId: string | number,
  payload: RejectVideoAccessRequestPayload,
  centerId?: string | number | null,
): Promise<VideoAccessRequest> {
  const basePath = buildRequestsBasePath(centerId);
  const { data } = await http.post<RawItemResponse<VideoAccessRequest>>(
    `${basePath}/${requestId}/reject`,
    payload,
  );

  return data?.data ?? (data as unknown as VideoAccessRequest);
}

export async function bulkApproveVideoAccessRequests(
  payload: BulkApproveVideoAccessRequestsPayload,
  centerId?: string | number | null,
): Promise<VideoAccessBulkActionResult> {
  const basePath = buildRequestsBasePath(centerId);
  const { data } = await http.post<
    RawItemResponse<VideoAccessBulkActionResult>
  >(`${basePath}/bulk-approve`, payload);

  return data?.data ?? (data as unknown as VideoAccessBulkActionResult);
}

export async function bulkRejectVideoAccessRequests(
  payload: BulkRejectVideoAccessRequestsPayload,
  centerId?: string | number | null,
): Promise<VideoAccessBulkActionResult> {
  const basePath = buildRequestsBasePath(centerId);
  const { data } = await http.post<
    RawItemResponse<VideoAccessBulkActionResult>
  >(`${basePath}/bulk-reject`, payload);

  return data?.data ?? (data as unknown as VideoAccessBulkActionResult);
}

export async function listVideoAccessCodes(
  params: ListVideoAccessCodesParams,
  centerId?: string | number | null,
): Promise<PaginatedResponse<VideoAccessCode>> {
  const effectiveCenterId = centerId ?? params.center_id;
  const basePath = buildCodesBasePath(effectiveCenterId);

  const { data } = await http.get<RawPaginatedResponse<VideoAccessCode>>(
    basePath,
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        status: params.status || undefined,
        user_id: params.user_id ?? undefined,
        video_id: params.video_id ?? undefined,
        course_id: params.course_id ?? undefined,
      },
    },
  );

  return normalizePaginatedList(data, params.page ?? 1, params.per_page ?? 10);
}

export async function generateVideoAccessCode(
  studentId: string | number,
  payload: GenerateVideoAccessCodePayload,
  centerId?: string | number | null,
): Promise<GeneratedVideoAccessCode> {
  const basePath = buildStudentsBasePath(centerId);
  const { data } = await http.post<RawItemResponse<GeneratedVideoAccessCode>>(
    `${basePath}/${studentId}/video-access-codes`,
    payload,
  );

  return data?.data ?? (data as unknown as GeneratedVideoAccessCode);
}

export async function sendVideoAccessCodeWhatsapp(
  codeId: string | number,
  payload: SendVideoAccessCodeWhatsappPayload,
  centerId?: string | number | null,
): Promise<VideoAccessCode> {
  const basePath = buildCodesBasePath(centerId);
  const { data } = await http.post<RawItemResponse<VideoAccessCode>>(
    `${basePath}/${codeId}/send-whatsapp`,
    payload,
  );

  return data?.data ?? (data as unknown as VideoAccessCode);
}

export async function bulkSendVideoAccessCodesWhatsapp(
  payload: BulkSendVideoAccessCodesWhatsappPayload,
  centerId?: string | number | null,
): Promise<BulkWhatsappJob> {
  const basePath = buildCodesBasePath(centerId);
  const { data } = await http.post<RawItemResponse<BulkWhatsappJob>>(
    `${basePath}/bulk-send-whatsapp`,
    payload,
  );

  return normalizeBulkWhatsappJob(data?.data ?? data);
}

export async function getBulkWhatsappJob(
  jobId: string | number,
  centerId?: string | number | null,
): Promise<BulkWhatsappJob> {
  const basePath = buildBulkJobsBasePath(centerId);
  const { data } = await http.get<RawItemResponse<BulkWhatsappJob>>(
    `${basePath}/${jobId}`,
  );

  return normalizeBulkWhatsappJob(data?.data ?? data);
}
