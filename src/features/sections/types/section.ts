export type TranslationsRecord = Record<string, string>;

export type SectionMediaItem = {
  id: string | number;
  title?: string | null;
  name?: string | null;
  type?: string | null;
  [key: string]: unknown;
};

export type Section = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  sort_order?: number | null;
  order_index?: number | null;
  name?: string | null;
  status?: string | null;
  is_visible?: boolean | null;
  videos?: SectionMediaItem[];
  pdfs?: SectionMediaItem[];
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type SectionStructurePayload = {
  title_translations: TranslationsRecord & { en: string };
  description_translations?: TranslationsRecord;
  sort_order?: number;
  order_index?: number;
  videos?: Array<string | number>;
  pdfs?: Array<string | number>;
  [key: string]: unknown;
};

export type SectionPayload = {
  title_translations: TranslationsRecord & { en: string };
  description_translations?: TranslationsRecord;
  order_index?: number;
  sort_order?: number;
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
