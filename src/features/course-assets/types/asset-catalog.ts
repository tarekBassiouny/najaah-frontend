export type AssetSlotType =
  | "summary"
  | "quiz"
  | "flashcards"
  | "assignment"
  | "interactive_activity";

export type AssetSlotState =
  | "missing"
  | "draft"
  | "generating"
  | "review_required"
  | "approved"
  | "published"
  | "failed";

export type AssetCanonicalRef =
  | {
      id: number;
      kind: "quiz" | "assignment";
      title: string | null;
      is_active: boolean;
      updated_at: string;
    }
  | {
      id: number;
      kind: "learning_asset";
      title: string | null;
      status: number;
      status_label: string;
      is_active: boolean;
      updated_at: string;
    };

export type AssetJobRef = {
  id: number;
  batch_key: string | null;
  status: number;
  status_label: string;
  error_message: string | null;
};

export type CourseAssetSlot = {
  asset_type: AssetSlotType;
  slot_state: AssetSlotState;
  canonical: AssetCanonicalRef | null;
  latest_job: AssetJobRef | null;
  available_actions?: string[];
};

export type AIReadiness = {
  is_ready: boolean;
  code: string;
  badge: string;
  title: string;
  message: string;
};

export type CourseAssetSource = {
  type: "video" | "pdf";
  id: number;
  title: string | null;
  order_index: number;
  ai_readiness?: AIReadiness | null;
  has_transcript?: boolean | null;
  transcript_format?: string | null;
  transcript_source?: string | null;
  has_extracted_text?: boolean | null;
  text_extraction_status?: number | string | null;
  text_extraction_status_label?: string | null;
  section: {
    id: number;
    title: string | null;
    order_index: number;
  } | null;
  assets: CourseAssetSlot[];
};

export type AssetCatalogResponse = {
  course: {
    id: number;
    title: string | null;
  };
  sources: CourseAssetSource[];
};

export type AssetCatalogQuery = {
  section_id?: number;
  source_type?: "video" | "pdf";
  source_id?: number;
};
