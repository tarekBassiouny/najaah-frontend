import type { TranslationsRecord } from "@/types/translations";

export type SurveyScopeType = 1 | 2;

export type SurveyType = 1 | 2 | 3;

export type SurveyQuestionType = 1 | 2 | 3 | 4 | 5;

export type SurveyApiScopeContext = {
  centerId?: number | string | null;
};

export type SurveyAssignmentType =
  | "all"
  | "center"
  | "course"
  | "video"
  | "user";

export type SurveyAssignment = {
  type?: SurveyAssignmentType | string;
  id?: string | number | null;
  assignable_id?: string | number | null;
  assignable_name?: string | null;
  [key: string]: unknown;
};

export type SurveyOption = {
  id?: string | number;
  option_translations?: TranslationsRecord | null;
  order_index?: number | null;
  count?: number | null;
  responses?: number | null;
  total?: number | null;
  value?: number | string | null;
  [key: string]: unknown;
};

export type SurveyQuestion = {
  id?: string | number;
  question_translations?: TranslationsRecord | null;
  question?: string | null;
  title?: string | null;
  text?: string | null;
  type?: SurveyQuestionType | number | string | null;
  is_required?: boolean | null;
  total_responses?: number | null;
  responses_count?: number | null;
  options?: SurveyOption[] | null;
  choices?: SurveyOption[] | null;
  answers?: Array<SurveyOption | string | Record<string, unknown>> | null;
  distribution?: SurveyOption[] | null;
  text_answers?: Array<string | Record<string, unknown>> | null;
  responses?: Array<string | Record<string, unknown>> | number | null;
  [key: string]: unknown;
};

export type Survey = {
  id: string | number;
  scope_type?: SurveyScopeType | number | string | null;
  center_id?: number | null;
  center?: {
    id?: string | number;
    name?: string | null;
    [key: string]: unknown;
  } | null;
  title?: string | null;
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  type?: number | string | null;
  is_active?: boolean | null;
  is_mandatory?: boolean | null;
  allow_multiple_submissions?: boolean | null;
  show_to_all_students?: boolean | null;
  assignment?: SurveyAssignment | null;
  assignments?: SurveyAssignment[] | null;
  submitted_users_count?: number | string | null;
  start_at?: string | null;
  end_at?: string | null;
  questions?: SurveyQuestion[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ListSurveysParams = {
  page: number;
  per_page: number;
  search?: string;
  center_id?: number;
  is_active?: boolean;
  is_mandatory?: boolean;
  type?: SurveyType;
  start_from?: string;
  start_to?: string;
  end_from?: string;
  end_to?: string;
};

export type SurveysResponse = {
  items: Survey[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

export type SurveyTargetStudent = {
  id: string | number;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  center_id?: number | null;
  center?: {
    id?: string | number;
    name?: string | null;
    slug?: string | null;
    [key: string]: unknown;
  } | null;
  status?: string | number | null;
  status_key?: string | null;
  status_label?: string | null;
  [key: string]: unknown;
};

export type ListSurveyTargetStudentsParams = {
  scope_type: SurveyScopeType;
  center_id?: number;
  status?: string | number;
  search?: string;
  page: number;
  per_page: number;
};

export type SurveyTargetStudentsResponse = {
  items: SurveyTargetStudent[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

export type SurveyQuestionOptionPayload = {
  option_translations: TranslationsRecord;
  order_index: number;
};

export type SurveyQuestionPayload = {
  question_translations: TranslationsRecord;
  type: SurveyQuestionType;
  is_required: boolean;
  options?: SurveyQuestionOptionPayload[];
};

export type CreateSurveyPayload = {
  scope_type: SurveyScopeType;
  center_id: number | null;
  assignments: Array<
    | {
        type: "all";
      }
    | {
        type: Exclude<SurveyAssignmentType, "all">;
        id: number;
      }
  >;
  title_translations: TranslationsRecord;
  description_translations?: TranslationsRecord;
  type: SurveyType;
  is_active: boolean;
  is_mandatory: boolean;
  allow_multiple_submissions: boolean;
  start_at?: string;
  end_at?: string;
  questions: SurveyQuestionPayload[];
};

export type UpdateSurveyPayload = Partial<
  Omit<CreateSurveyPayload, "scope_type" | "center_id" | "assignments">
> & {
  center_id?: number | null;
  questions?: SurveyQuestionPayload[];
};

export type AssignSurveyPayload = {
  assignments: CreateSurveyPayload["assignments"];
};

export type UpdateSurveyStatusPayload = {
  is_active: boolean;
};

export type BulkUpdateSurveyStatusPayload = {
  is_active: boolean;
  survey_ids: Array<string | number>;
};

export type BulkSurveyActionPayload = {
  survey_ids: Array<string | number>;
};

export type BulkSurveyActionResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
    [key: string]: unknown;
  };
  updated?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type BulkUpdateSurveyStatusResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
    [key: string]: unknown;
  };
  updated?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type SurveyAnalyticsRaw = Record<string, unknown>;

export type SurveyAnalyticsMetric = {
  label: string;
  value: number;
};

export type SurveyAnalyticsOption = {
  label: string;
  count: number;
};

export type SurveyAnalyticsQuestionView = {
  id: string;
  title: string;
  typeLabel: string;
  totalResponses: number;
  options: SurveyAnalyticsOption[];
  textResponses: string[];
};

export type SurveyAnalyticsSection = {
  title: string;
  data: unknown;
};

export type SurveyAnalyticsViewModel = {
  metrics: SurveyAnalyticsMetric[];
  questions: SurveyAnalyticsQuestionView[];
  extraSections: SurveyAnalyticsSection[];
  raw: SurveyAnalyticsRaw;
};
