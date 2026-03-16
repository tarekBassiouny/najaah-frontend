import { http } from "@/lib/http";
import type {
  LearningAssetAdminResource,
  ListLearningAssetsQuery,
  ListLearningAssetsResponse,
  UpdateLearningAssetPayload,
  UpdateLearningAssetStatusPayload,
} from "@/features/learning-assets/types/learning-asset";

type RawResponse<T = unknown> = {
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

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeList(payload: unknown): ListLearningAssetsResponse {
  const root = asRecord(payload);
  const dataNode = Object.prototype.hasOwnProperty.call(root, "data")
    ? root.data
    : payload;
  const normalizedDataNode = asRecord(dataNode);
  const items = asArray<LearningAssetAdminResource>(
    Array.isArray(dataNode) ? dataNode : (normalizedDataNode.data ?? dataNode),
  );
  const meta = asRecord(root.meta ?? normalizedDataNode.meta);

  const page = toNumber(
    meta.page ?? meta.current_page ?? normalizedDataNode.page,
    1,
  );
  const perPage = toNumber(
    meta.per_page ?? normalizedDataNode.per_page,
    items.length || 15,
  );
  const total = toNumber(meta.total ?? normalizedDataNode.total, items.length);
  const lastPage = toNumber(
    meta.last_page ??
      normalizedDataNode.last_page ??
      Math.max(1, Math.ceil(total / Math.max(1, perPage))),
    1,
  );

  return {
    items,
    page,
    per_page: perPage,
    total,
    last_page: lastPage,
  };
}

function normalizeItem(payload: unknown): LearningAssetAdminResource {
  const root = asRecord(payload);
  const dataNode = Object.prototype.hasOwnProperty.call(root, "data")
    ? root.data
    : payload;
  return dataNode as LearningAssetAdminResource;
}

export async function listLearningAssets(
  centerId: string | number,
  courseId: string | number,
  query: ListLearningAssetsQuery = {},
): Promise<ListLearningAssetsResponse> {
  const { data } = await http.get<RawResponse>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/learning-assets`,
    {
      params: {
        attachable_type: query.attachable_type,
        attachable_id: query.attachable_id,
        asset_type: query.asset_type,
        status: query.status,
        page: query.page,
        per_page: query.per_page,
      },
    },
  );

  return normalizeList(data);
}

export async function getLearningAsset(
  centerId: string | number,
  assetId: string | number,
): Promise<LearningAssetAdminResource> {
  const { data } = await http.get<RawResponse>(
    `/api/v1/admin/centers/${centerId}/learning-assets/${assetId}`,
  );

  return normalizeItem(data);
}

export async function updateLearningAsset(
  centerId: string | number,
  assetId: string | number,
  payload: UpdateLearningAssetPayload,
): Promise<LearningAssetAdminResource> {
  const { data } = await http.put<RawResponse>(
    `/api/v1/admin/centers/${centerId}/learning-assets/${assetId}`,
    payload,
  );

  return normalizeItem(data);
}

export async function updateLearningAssetStatus(
  centerId: string | number,
  assetId: string | number,
  payload: UpdateLearningAssetStatusPayload,
): Promise<LearningAssetAdminResource> {
  const { data } = await http.patch<RawResponse>(
    `/api/v1/admin/centers/${centerId}/learning-assets/${assetId}/status`,
    payload,
  );

  return normalizeItem(data);
}
