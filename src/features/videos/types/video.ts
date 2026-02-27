export type TranslationsRecord = Record<string, string>;

export type VideoSourceMode = "upload" | "url";

export type VideoEncodingStatusKey =
  | "pending"
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

export type VideoLifecycleStatusKey = "pending" | "processing" | "ready";

export type VideoCenterRef = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
};

export type VideoCreatorRef = {
  id: string | number;
  name?: string | null;
};

export type Video = {
  id: string | number;
  title?: string | null;
  title_translations?: TranslationsRecord | null;
  description?: string | null;
  description_translations?: TranslationsRecord | null;
  tags?: string[] | null;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
  duration?: number | string | null;
  duration_seconds?: number | null;
  encoding_status?: number | string | null;
  source_type?: 0 | 1 | string | number | null;
  source_provider?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  thumbnail_url?: string | null;
  encoding_status_key?: VideoEncodingStatusKey | string | null;
  encoding_status_label?: string | null;
  lifecycle_status?: number | string | null;
  lifecycle_status_key?: VideoLifecycleStatusKey | string | null;
  lifecycle_status_label?: string | null;
  center?: VideoCenterRef | null;
  creator?: VideoCreatorRef | null;
  upload_sessions?: VideoUploadSession[] | null;
  upload_session_id?: string | number | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course_id?: string | number | null;
  [key: string]: unknown;
};

export type VideoUploadSession = {
  id: string | number;
  upload_session_id?: string | number;
  provider?: string | null;
  remote_id?: string | null;
  upload_url?: string | null;
  upload_endpoint?: string | null;
  presigned_headers?: Record<string, string | number | boolean> | null;
  status?: string | null;
  upload_status?: string | number | null;
  upload_status_key?: VideoEncodingStatusKey | string | null;
  upload_status_label?: string | null;
  progress_percent?: number | null;
  last_error_message?: string | null;
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  video_id?: string | number | null;
  video?: Video | null;
  original_filename?: string;
  expires_at?: string | null;
  [key: string]: unknown;
};

export type VideoCreateUploadResult = {
  video: Video;
  upload_session: VideoUploadSession;
  _response_message?: string;
  success?: boolean;
  code?: string;
  errors?: Record<string, unknown>;
};

export type VideoPreviewResponse = {
  embed_url: string;
  expires_at: string | null;
  expires: number | null;
  _response_message?: string;
  success?: boolean;
  code?: string;
  errors?: Record<string, unknown>;
};
