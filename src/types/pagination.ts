export type PaginatedMeta = {
  page: number;
  per_page: number;
  total: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginatedMeta;
};
