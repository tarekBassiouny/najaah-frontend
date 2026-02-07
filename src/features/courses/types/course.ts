export type TranslationsRecord = Record<string, string>;

export type CenterSummary = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type CategorySummary = {
  id: string | number;
  title?: string | null;
  [key: string]: unknown;
};

export type InstructorSummary = {
  id: string | number;
  name?: string | null;
  [key: string]: unknown;
};

export type VideoSummary = {
  id: string | number;
  title?: string | null;
  [key: string]: unknown;
};

export type PdfSummary = {
  id: string | number;
  title?: string | null;
  [key: string]: unknown;
};

export type CourseSetting = {
  id?: string | number;
  settings?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type CourseVideo = {
  id: string | number;
  video?: VideoSummary | null;
  order_index?: number | null;
  visible?: boolean | null;
  view_limit_override?: number | null;
  [key: string]: unknown;
};

export type CoursePdf = {
  id: string | number;
  pdf?: PdfSummary | null;
  order_index?: number | null;
  visible?: boolean | null;
  [key: string]: unknown;
};

export type CourseSummary = {
  id: string | number;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  language?: string | null;
  thumbnail?: string | null;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
  published_at?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type Course = {
  id: string | number;
  title?: string | null;
  name?: string | null;
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  difficulty?: string | null;
  language?: string | null;
  thumbnail?: string | null;
  price?: number | string | null;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
  published_at?: string | null;
  slug?: string | null;
  center?: CenterSummary | null;
  category?: CategorySummary | null;
  primary_instructor?: InstructorSummary | null;
  instructors?: InstructorSummary[] | null;
  sections?: Array<Record<string, unknown>> | null;
  videos?: CourseVideo[] | null;
  pdfs?: CoursePdf[] | null;
  settings?: CourseSetting | CourseSetting[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type CreateCoursePayload = {
  title: string;
  slug?: string;
  description?: string;
  category_id?: string | number;
  instructor_id?: string | number;
  status?: string;
  [key: string]: unknown;
};

export type UpdateCoursePayload = Partial<CreateCoursePayload> & {
  status?: string;
};
