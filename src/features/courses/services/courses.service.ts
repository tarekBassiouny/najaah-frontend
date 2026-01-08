import { http } from "@/lib/http";

export type Course = {
  id: string | number;
  title?: string;
  name?: string;
  slug?: string;
  status?: string;
  [key: string]: unknown;
};

export type ListCoursesParams = {
  page: number;
  per_page: number;
  search?: string;
};

export type CoursesResponse = {
  items: Course[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

type RawResponse = {
  data?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function normalizeCoursesResponse(
  raw: RawResponse | undefined,
  fallback: ListCoursesParams,
): CoursesResponse {
  const container =
    raw && typeof raw === "object" && raw !== null
      ? (raw as RawResponse)
      : {};
  const dataNode = (container.data ?? container) as any;
  const items = Array.isArray(dataNode?.data)
    ? (dataNode.data as Course[])
    : Array.isArray(dataNode)
      ? (dataNode as Course[])
      : [];

  const meta =
    (dataNode?.meta as Record<string, unknown> | undefined) ??
    (container.meta as Record<string, unknown> | undefined) ??
    {};

  const page =
    Number(meta.current_page ?? dataNode?.current_page ?? container.current_page) ||
    fallback.page;
  const perPage =
    Number(meta.per_page ?? dataNode?.per_page ?? container.per_page) ||
    fallback.per_page;
  const total =
    Number(meta.total ?? dataNode?.total ?? container.total) || items.length;
  const lastPage =
    Number(
      meta.last_page ?? dataNode?.last_page ?? container.last_page ?? 1,
    ) || 1;

  return {
    items,
    page,
    perPage,
    total,
    lastPage,
  };
}

export async function listCourses(params: ListCoursesParams) {
  const { data } = await http.get<RawResponse>("/api/v1/admin/courses", {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
    },
  });

  return normalizeCoursesResponse(data, params);
}
