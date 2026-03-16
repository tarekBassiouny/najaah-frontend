import { http } from "@/lib/http";
import type {
  AssetCatalogQuery,
  AssetCatalogResponse,
} from "@/features/course-assets/types/asset-catalog";

type RawResponse<T = unknown> = {
  data?: T;
  [key: string]: unknown;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as UnknownRecord;
}

function normalizeAssetCatalog(payload: unknown): AssetCatalogResponse {
  const root = asRecord(payload);
  const dataNode = Object.prototype.hasOwnProperty.call(root, "data")
    ? root.data
    : payload;
  const data = asRecord(dataNode);

  return {
    course: (data.course ?? {
      id: 0,
      title: null,
    }) as AssetCatalogResponse["course"],
    sources: Array.isArray(data.sources)
      ? (data.sources as AssetCatalogResponse["sources"])
      : [],
  };
}

export async function getAssetCatalog(
  centerId: string | number,
  courseId: string | number,
  query: AssetCatalogQuery = {},
): Promise<AssetCatalogResponse> {
  const { data } = await http.get<RawResponse<AssetCatalogResponse>>(
    `/api/v1/admin/centers/${centerId}/courses/${courseId}/asset-catalog`,
    {
      params: {
        section_id: query.section_id,
        source_type: query.source_type,
        source_id: query.source_id,
      },
    },
  );

  return normalizeAssetCatalog(data);
}
