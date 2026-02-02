import { http } from "@/lib/http";
import type {
  ListSectionsParams,
  ReorderSectionsPayload,
  Section,
  SectionMediaItem,
  SectionPayload,
  SectionStructurePayload,
  SectionsResponse,
} from "@/features/sections/types/section";

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function normalizeSectionsResponse(
  raw: RawResponse | undefined,
  fallback: ListSectionsParams,
): SectionsResponse {
  const container =
    raw && typeof raw === "object" && raw !== null ? (raw as RawResponse) : {};
  const dataNode = (container.data ?? container) as any;
  const items = Array.isArray(dataNode?.data)
    ? (dataNode.data as Section[])
    : Array.isArray(dataNode)
      ? (dataNode as Section[])
      : [];

  const meta =
    (dataNode?.meta as Record<string, unknown> | undefined) ??
    (container.meta as Record<string, unknown> | undefined) ??
    {};

  const page = Number(meta.current_page ?? dataNode?.current_page ?? 1) || 1;
  const perPage =
    Number(meta.per_page ?? dataNode?.per_page ?? fallback.per_page ?? 10) || 10;
  const total = Number(meta.total ?? dataNode?.total ?? items.length) || items.length;
  const lastPage = Number(meta.last_page ?? dataNode?.last_page ?? 1) || 1;

  return {
    items,
    page,
    perPage,
    total,
    lastPage,
  };
}

function basePath(centerId: string | number, courseId: string | number) {
  return `/api/v1/admin/centers/${centerId}/courses/${courseId}/sections`;
}

export async function listSections(
  centerId: string | number,
  courseId: string | number,
  params: ListSectionsParams = {},
) {
  const { data } = await http.get<RawResponse>(basePath(centerId, courseId), {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
    },
  });

  return normalizeSectionsResponse(data, params);
}

export async function getSection(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<Section> {
  const { data } = await http.get<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}`,
  );
  return (data?.data ?? data) as Section;
}

export async function createSection(
  centerId: string | number,
  courseId: string | number,
  payload: SectionPayload,
): Promise<Section> {
  const { data } = await http.post<RawResponse>(
    basePath(centerId, courseId),
    payload,
  );
  return (data?.data ?? data) as Section;
}

export async function updateSection(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  payload: SectionPayload,
): Promise<Section> {
  const { data } = await http.put<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}`,
    payload,
  );
  return (data?.data ?? data) as Section;
}

export async function deleteSection(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId, courseId)}/${sectionId}`);
}

export async function restoreSection(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<Section> {
  const { data } = await http.post<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/restore`,
  );
  return (data?.data ?? data) as Section;
}

export async function toggleSectionVisibility(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<Section> {
  const { data } = await http.patch<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/visibility`,
  );
  return (data?.data ?? data) as Section;
}

export async function reorderSections(
  centerId: string | number,
  courseId: string | number,
  payload: ReorderSectionsPayload,
) {
  const { data } = await http.put(
    `${basePath(centerId, courseId)}/reorder`,
    payload,
  );
  return data;
}

export async function createSectionWithStructure(
  centerId: string | number,
  courseId: string | number,
  payload: SectionStructurePayload,
): Promise<Section> {
  const { data } = await http.post<RawResponse>(
    `${basePath(centerId, courseId)}/structure`,
    payload,
  );
  return (data?.data ?? data) as Section;
}

export async function updateSectionWithStructure(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  payload: SectionStructurePayload,
): Promise<Section> {
  const { data } = await http.put<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/structure`,
    payload,
  );
  return (data?.data ?? data) as Section;
}

export async function deleteSectionWithStructure(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<void> {
  await http.delete(`${basePath(centerId, courseId)}/${sectionId}/structure`);
}

export async function listSectionVideos(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<SectionMediaItem[]> {
  const { data } = await http.get<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/videos`,
  );
  return (data?.data ?? data) as SectionMediaItem[];
}

export async function getSectionVideo(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  videoId: string | number,
): Promise<SectionMediaItem> {
  const { data } = await http.get<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/videos/${videoId}`,
  );
  return (data?.data ?? data) as SectionMediaItem;
}

export async function attachSectionVideo(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  payload: { video_id: string | number; [key: string]: unknown },
) {
  const { data } = await http.post(
    `${basePath(centerId, courseId)}/${sectionId}/videos`,
    payload,
  );
  return data;
}

export async function detachSectionVideo(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  videoId: string | number,
) {
  const { data } = await http.delete(
    `${basePath(centerId, courseId)}/${sectionId}/videos/${videoId}`,
  );
  return data;
}

export async function listSectionPdfs(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<SectionMediaItem[]> {
  const { data } = await http.get<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/pdfs`,
  );
  return (data?.data ?? data) as SectionMediaItem[];
}

export async function getSectionPdf(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  pdfId: string | number,
): Promise<SectionMediaItem> {
  const { data } = await http.get<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/pdfs/${pdfId}`,
  );
  return (data?.data ?? data) as SectionMediaItem;
}

export async function attachSectionPdf(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  payload: { pdf_id: string | number; [key: string]: unknown },
) {
  const { data } = await http.post(
    `${basePath(centerId, courseId)}/${sectionId}/pdfs`,
    payload,
  );
  return data;
}

export async function detachSectionPdf(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
  pdfId: string | number,
) {
  const { data } = await http.delete(
    `${basePath(centerId, courseId)}/${sectionId}/pdfs/${pdfId}`,
  );
  return data;
}

export async function publishSection(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<Section> {
  const { data } = await http.post<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/publish`,
  );
  return (data?.data ?? data) as Section;
}

export async function unpublishSection(
  centerId: string | number,
  courseId: string | number,
  sectionId: string | number,
): Promise<Section> {
  const { data } = await http.post<RawResponse>(
    `${basePath(centerId, courseId)}/${sectionId}/unpublish`,
  );
  return (data?.data ?? data) as Section;
}
