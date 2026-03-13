export type LearningAssetStatus = 0 | 1 | 2;
export type LearningAssetType =
  | "summary"
  | "flashcards"
  | "interactive_activity";

export type LearningAssetAdminResource = {
  id: number;
  center_id: number;
  course_id: number;
  attachable_type: "video" | "pdf" | "section" | "course" | null;
  attachable_id: number | null;
  attachable_label: string | null;
  asset_type: LearningAssetType;
  status: LearningAssetStatus;
  status_label: string;
  title: string | null;
  title_translations: Record<string, string> | null;
  content: string | null;
  content_translations: Record<string, string> | null;
  payload: Record<string, unknown> | null;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListLearningAssetsQuery = {
  attachable_type?: "video" | "pdf";
  attachable_id?: number;
  asset_type?: LearningAssetType;
  status?: LearningAssetStatus;
  page?: number;
  per_page?: number;
};

export type ListLearningAssetsResponse = {
  items: LearningAssetAdminResource[];
  page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type UpdateLearningAssetPayload = {
  title_translations?: Record<string, string>;
  content_translations?: Record<string, string>;
  payload?: Record<string, unknown>;
};

export type UpdateLearningAssetStatusPayload = {
  status: LearningAssetStatus;
};
