export type AIProviderKey = "openai" | "anthropic" | "gemini" | (string & {});

export type AIJobStatus =
  | 0 // pending
  | 1 // processing
  | 2 // completed
  | 3 // failed
  | 4 // approved
  | 5 // published
  | 6; // discarded

export type AIContentSourceType = "video" | "pdf" | "section" | "course";

export type AIContentTargetType =
  | "quiz"
  | "assignment"
  | "summary"
  | "flashcards"
  | "interactive_activity";

export type AIContentLanguage = "en" | "ar" | "both";

export interface AILimits {
  daily_job_limit: number;
  monthly_job_limit: number;
  daily_token_limit: number;
  monthly_token_limit: number;
  max_input_chars: number;
  max_output_chars: number;
  max_concurrent_jobs: number;
  default_output_token_estimate: number;
}

export interface AISystemProvider {
  key: AIProviderKey;
  label: string;
  is_enabled: boolean;
  default_model: string | null;
  models: string[];
  configured: boolean;
  has_custom_api_key: boolean;
}

export interface AICenterProvider {
  key: AIProviderKey;
  label: string;
  enabled: boolean;
  configured: boolean;
  default_model: string | null;
  models: string[];
  limits: AILimits;
  system_enabled: boolean;
  center_enabled: boolean;
  has_custom_api_key: boolean;
  allowed_models?: string[] | null;
}

export interface AICenterOptions {
  default_provider: AIProviderKey | null;
  providers: AICenterProvider[];
}

export interface AIContentJob {
  id: number;
  center_id: number;
  course_id: number;
  batch_key?: string | null;
  source_type: AIContentSourceType;
  source_id: number;
  source_label?: string | null;
  target_type: AIContentTargetType;
  target_id: number | null;
  target_label?: string | null;
  language: AIContentLanguage;
  status: AIJobStatus;
  status_label: string;
  generation_config: Record<string, unknown> | null;
  generated_payload: Record<string, unknown> | null;
  reviewed_payload: Record<string, unknown> | null;
  ai_provider: AIProviderKey | null;
  ai_model: string | null;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  error_message: string | null;
  validation_warnings?: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishResult {
  target_type: AIContentTargetType;
  target_id: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  code?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface AIJobsListQuery {
  course_id?: number | string;
  batch_key?: string;
  target_type?: AIContentTargetType;
  status?: AIJobStatus | number | string;
  page?: number;
  per_page?: number;
}

export interface AIJobsListMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export type AIJobsListResponse = ApiSuccess<AIContentJob[]> & {
  meta: AIJobsListMeta;
};

export type UpdateAISystemProviderPayload = {
  is_enabled?: boolean;
  default_model?: string | null;
  models?: string[];
  api_key?: string | null;
};

export type UpdateAICenterProviderPayload = {
  is_enabled?: boolean;
  allowed_models?: string[];
  default_model?: string | null;
  limits?: Partial<AILimits>;
};

export type TargetType = AIContentTargetType;
export type SourceType = AIContentSourceType;

export interface BaseCreateJobForm {
  course_id: number;
  source_type: SourceType;
  source_id: number;
  target_type: TargetType;
  target_id?: number | null;
  language: AIContentLanguage;
  ai_provider: AIProviderKey;
  ai_model: string;
}

export interface QuizGenerationConfig {
  question_count?: number;
  difficulty?: "easy" | "medium" | "hard";
  include_explanations?: boolean;
  focus_topics?: string[];
}

export interface AssignmentGenerationConfig {
  assignment_type?: "homework" | "project" | "exam_prep";
  max_points?: number;
  passing_score?: number;
  submission_types?: number[];
  rubric_style?: "basic" | "detailed";
}

export interface SummaryGenerationConfig {
  length?: "short" | "medium" | "long";
  tone?: "simple" | "academic";
  bullet_points?: boolean;
  include_key_terms?: boolean;
}

export interface FlashcardsGenerationConfig {
  cards_count?: number;
  difficulty?: "easy" | "medium" | "hard";
  include_definitions?: boolean;
}

export interface InteractiveActivityGenerationConfig {
  activity_style?: "steps" | "scenario" | "practice";
  steps_count?: number;
  estimated_minutes?: number;
  include_reflection?: boolean;
}

export type GenerationConfigByTarget = {
  quiz: QuizGenerationConfig;
  assignment: AssignmentGenerationConfig;
  summary: SummaryGenerationConfig;
  flashcards: FlashcardsGenerationConfig;
  interactive_activity: InteractiveActivityGenerationConfig;
};

export type CreateJobPayload<T extends TargetType = TargetType> =
  BaseCreateJobForm & {
    target_type: T;
    generation_config?: GenerationConfigByTarget[T];
  };

export type CreateAIBatchAssetRequest = {
  target_type: AIContentTargetType;
  target_id?: number | null;
  ai_provider?: AIProviderKey;
  ai_model?: string;
  generation_config?: Record<string, unknown>;
};

export type CreateAIBatchRequest = {
  course_id: number;
  source_type: AIContentSourceType;
  source_id: number;
  language: AIContentLanguage;
  assets: CreateAIBatchAssetRequest[];
};

export type CreateAIBatchResponse = ApiSuccess<{
  batch_key: string;
  jobs: AIContentJob[];
}>;
