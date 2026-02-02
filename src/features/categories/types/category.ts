export type CategoryTranslations = Record<string, string>;

export type Category = {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  title_translations?: CategoryTranslations | null;
  description_translations?: CategoryTranslations | null;
  slug?: string;
  parent_id?: string | number | null;
  order_index?: number | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type ListCategoriesParams = {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  parent_id?: string | number;
};

export type CreateCategoryPayload = {
  title_translations: CategoryTranslations;
  description_translations?: CategoryTranslations;
  order_index?: number;
  slug?: string;
  parent_id?: string | number | null;
  is_active?: boolean;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
