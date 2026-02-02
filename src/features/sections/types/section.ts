export type SectionMediaItem = {
  id: string | number;
  title?: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
};

export type Section = {
  id: string | number;
  title?: string;
  name?: string;
  status?: string;
  is_visible?: boolean;
  order?: number;
  videos?: SectionMediaItem[];
  pdfs?: SectionMediaItem[];
  [key: string]: unknown;
};

export type SectionStructurePayload = {
  title?: string;
  description?: string;
  videos?: Array<string | number>;
  pdfs?: Array<string | number>;
  [key: string]: unknown;
};

export type SectionPayload = {
  title: string;
  description?: string;
  is_visible?: boolean;
  order?: number;
  [key: string]: unknown;
};

export type ReorderSectionsPayload = {
  ordered_ids: Array<string | number>;
};

export type ListSectionsParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

export type SectionsResponse = {
  items: Section[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};
