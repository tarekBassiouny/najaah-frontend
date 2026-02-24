export type TranslationsRecord = Record<string, string>;
export type LocaleTranslations = {
  en?: string;
  ar?: string;
  [key: string]: string | undefined;
};

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
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  sort_order?: number | null;
  order_index?: number | null;
  name?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  visible?: boolean | null;
  is_visible?: boolean | null;
  videos?: SectionMediaItem[];
  pdfs?: SectionMediaItem[];
  videos_count?: number | null;
  pdfs_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type SectionStructurePayload = {
  title_translations: TranslationsRecord & { en: string };
  description_translations?: LocaleTranslations;
  sort_order?: number;
  order_index?: number;
  videos?: Array<string | number>;
  pdfs?: Array<string | number>;
  [key: string]: unknown;
};

export type SectionPayload = {
  title_translations: TranslationsRecord & { en: string };
  description_translations?: LocaleTranslations;
  order_index?: number;
  sort_order?: number;
  [key: string]: unknown;
};

export type SectionUpdatePayload = {
  title_translations?: LocaleTranslations;
  description_translations?: LocaleTranslations;
  order_index?: number;
  sort_order?: number;
  [key: string]: unknown;
};

export type ReorderSectionsPayload = {
  sections?: Array<string | number>;
  ordered_ids?: Array<string | number>;
};

export type ListSectionsParams = {
  page?: number;
  per_page?: number;
  search?: string;
  is_published?: boolean | "1" | "0";
};

export type SectionsResponse = {
  items: Section[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};
