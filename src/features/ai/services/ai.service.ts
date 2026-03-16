import { http } from "@/lib/http";
import type {
  AICenterOptions,
  AICenterProvider,
  AIContentJob,
  CreateAIBatchRequest,
  CreateAIBatchResponse,
  AIJobsListMeta,
  AIJobsListQuery,
  AIJobsListResponse,
  AIProviderKey,
  AISystemProvider,
  ApiSuccess,
  CreateJobPayload,
  PublishResult,
  UpdateAICenterProviderPayload,
  UpdateAISystemProviderPayload,
} from "@/features/ai/types/ai";

type RawResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as UnknownRecord;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readMessage(record: UnknownRecord): string | undefined {
  return typeof record.message === "string" ? record.message : undefined;
}

function normalizeSuccess<T>(payload: unknown, fallback: T): ApiSuccess<T> {
  const record = asRecord(payload);
  const hasData = Object.prototype.hasOwnProperty.call(record, "data");
  const data = (hasData ? (record.data as T) : (payload as T)) ?? fallback;

  return {
    success: true,
    data,
    message: readMessage(record),
  };
}

function baseSystemPath() {
  return "/api/v1/admin/ai/providers";
}

function baseCenterPath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/ai`;
}

function baseJobsPath(centerId: string | number) {
  return `/api/v1/admin/centers/${centerId}/ai-content/jobs`;
}

function normalizeMeta(
  metaNode: unknown,
  fallbackTotal: number,
): AIJobsListMeta {
  const meta = asRecord(metaNode);

  const page = Number(meta.page ?? meta.current_page ?? 1) || 1;
  const perPage = Number(meta.per_page ?? 15) || 15;
  const total = Number(meta.total ?? fallbackTotal) || fallbackTotal;
  const lastPage =
    Number(meta.last_page ?? meta.lastPage) ||
    (perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1);

  return {
    page,
    per_page: perPage,
    total,
    last_page: lastPage,
  };
}

function normalizeJobsListResponse(payload: unknown): AIJobsListResponse {
  const record = asRecord(payload);
  const hasData = Object.prototype.hasOwnProperty.call(record, "data");
  const outerData = hasData ? record.data : payload;

  let jobs = asArray<AIContentJob>(outerData);
  const innerDataRecord = asRecord(outerData);

  if (!jobs.length) {
    jobs = asArray<AIContentJob>(innerDataRecord.data);
  }

  const metaNode =
    (record.meta as unknown) ??
    (Object.prototype.hasOwnProperty.call(innerDataRecord, "meta")
      ? innerDataRecord.meta
      : undefined);

  return {
    success: true,
    data: jobs,
    message: readMessage(record),
    meta: normalizeMeta(metaNode, jobs.length),
  };
}

function toParam<T>(value: T | "" | null | undefined): T | undefined {
  if (value === "" || value == null) {
    return undefined;
  }
  return value;
}

export async function getSystemProviders(): Promise<
  ApiSuccess<AISystemProvider[]>
> {
  const { data } =
    await http.get<RawResponse<AISystemProvider[]>>(baseSystemPath());

  return normalizeSuccess(data, []);
}

export async function updateSystemProvider(
  provider: AIProviderKey,
  payload: UpdateAISystemProviderPayload,
): Promise<ApiSuccess<AISystemProvider>> {
  const { data } = await http.put<RawResponse<AISystemProvider>>(
    `${baseSystemPath()}/${provider}`,
    payload,
  );

  return normalizeSuccess(data, {} as AISystemProvider);
}

export async function getCenterProviders(
  centerId: string | number,
): Promise<ApiSuccess<AICenterProvider[]>> {
  const { data } = await http.get<RawResponse<AICenterProvider[]>>(
    `${baseCenterPath(centerId)}/providers`,
  );

  return normalizeSuccess(data, []);
}

export async function updateCenterProvider(
  centerId: string | number,
  provider: AIProviderKey,
  payload: UpdateAICenterProviderPayload,
): Promise<ApiSuccess<AICenterProvider>> {
  const { data } = await http.put<RawResponse<AICenterProvider>>(
    `${baseCenterPath(centerId)}/providers/${provider}`,
    payload,
  );

  return normalizeSuccess(data, {} as AICenterProvider);
}

export async function getCenterOptions(
  centerId: string | number,
  enabledOnly = true,
): Promise<ApiSuccess<AICenterOptions>> {
  const { data } = await http.get<RawResponse<AICenterOptions>>(
    `${baseCenterPath(centerId)}/options`,
    {
      params: {
        enabled_only: enabledOnly,
      },
    },
  );

  return normalizeSuccess(data, {
    default_provider: null,
    providers: [],
  });
}

export async function createJob(
  centerId: string | number,
  payload: CreateJobPayload,
): Promise<ApiSuccess<AIContentJob>> {
  const { data } = await http.post<RawResponse<AIContentJob>>(
    baseJobsPath(centerId),
    payload,
  );

  return normalizeSuccess(data, {} as AIContentJob);
}

export async function createBatch(
  centerId: string | number,
  payload: CreateAIBatchRequest,
): Promise<CreateAIBatchResponse> {
  const { data } = await http.post<
    RawResponse<{ batch_key: string; jobs: AIContentJob[] }>
  >(`/api/v1/admin/centers/${centerId}/ai-content/batches`, payload);

  return normalizeSuccess(data, {
    batch_key: "",
    jobs: [],
  });
}

export async function listJobs(
  centerId: string | number,
  query: AIJobsListQuery = {},
): Promise<AIJobsListResponse> {
  const { data } = await http.get<RawResponse<AIContentJob[]>>(
    baseJobsPath(centerId),
    {
      params: {
        course_id: toParam(query.course_id),
        batch_key: toParam(query.batch_key),
        target_type: toParam(query.target_type),
        status: toParam(query.status),
        page: toParam(query.page),
        per_page: toParam(query.per_page),
      },
    },
  );

  return normalizeJobsListResponse(data);
}

export async function getJob(
  centerId: string | number,
  jobId: string | number,
): Promise<ApiSuccess<AIContentJob>> {
  const { data } = await http.get<RawResponse<AIContentJob>>(
    `${baseJobsPath(centerId)}/${jobId}`,
  );

  return normalizeSuccess(data, {} as AIContentJob);
}

export async function reviewJob(
  centerId: string | number,
  jobId: string | number,
  reviewed_payload: Record<string, unknown>,
): Promise<ApiSuccess<AIContentJob>> {
  const { data } = await http.patch<RawResponse<AIContentJob>>(
    `${baseJobsPath(centerId)}/${jobId}/review`,
    { reviewed_payload },
  );

  return normalizeSuccess(data, {} as AIContentJob);
}

export async function approveJob(
  centerId: string | number,
  jobId: string | number,
): Promise<ApiSuccess<AIContentJob>> {
  const { data } = await http.post<RawResponse<AIContentJob>>(
    `${baseJobsPath(centerId)}/${jobId}/approve`,
  );

  return normalizeSuccess(data, {} as AIContentJob);
}

export async function publishJob(
  centerId: string | number,
  jobId: string | number,
): Promise<ApiSuccess<{ job: AIContentJob; publication: PublishResult }>> {
  const { data } = await http.post<
    RawResponse<{ job: AIContentJob; publication: PublishResult }>
  >(`${baseJobsPath(centerId)}/${jobId}/publish`);

  return normalizeSuccess(data, {
    job: {} as AIContentJob,
    publication: {
      target_type: "summary",
      target_id: 0,
    },
  });
}

export async function discardJob(
  centerId: string | number,
  jobId: string | number,
): Promise<ApiSuccess<null>> {
  const { data } = await http.delete<RawResponse<null>>(
    `${baseJobsPath(centerId)}/${jobId}`,
  );

  return normalizeSuccess(data, null);
}
