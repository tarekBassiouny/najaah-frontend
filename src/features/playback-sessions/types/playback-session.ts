import type { PaginatedResponse } from "@/types/pagination";

export type PlaybackSessionSummary = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

export type PlaybackSessionVideo = {
  id: number | string;
  title?: string | null;
  duration_seconds?: number | null;
  duration?: number | string | null;
  thumbnail_url?: string | null;
};

export type PlaybackSessionCourse = {
  id: number | string;
  title?: string | null;
};

export type PlaybackSessionDevice = {
  device_id?: string | null;
  device_name?: string | null;
  device_type?: string | null;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
};

export type PlaybackSession = {
  id: number | string;
  user?: PlaybackSessionSummary | null;
  video?: PlaybackSessionVideo | null;
  course?: PlaybackSessionCourse | null;
  device?: PlaybackSessionDevice | null;
  started_at?: string | null;
  ended_at?: string | null;
  expires_at?: string | null;
  last_activity_at?: string | null;
  embed_token_expires_at?: string | null;
  progress_percent?: number | null;
  is_full_play?: boolean | null;
  is_locked?: boolean | null;
  auto_closed?: boolean | null;
  watch_duration?: number | null;
  close_reason?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PlaybackSessionFilters = {
  page?: number;
  per_page?: number;
  user_id?: number | string;
  video_id?: number | string;
  course_id?: number | string;
  is_full_play?: boolean;
  is_locked?: boolean;
  auto_closed?: boolean;
  is_active?: boolean;
  search?: string;
  started_from?: string;
  started_to?: string;
  order_by?:
    | "started_at"
    | "updated_at"
    | "progress_percent"
    | "watch_duration";
  order_direction?: "asc" | "desc";
};

export type PlaybackSessionsListParams = Pick<
  PlaybackSessionFilters,
  | "page"
  | "per_page"
  | "user_id"
  | "video_id"
  | "course_id"
  | "is_full_play"
  | "is_locked"
  | "auto_closed"
  | "is_active"
  | "search"
  | "started_from"
  | "started_to"
  | "order_by"
  | "order_direction"
>;

export type PlaybackSessionsApiResponse = PaginatedResponse<PlaybackSession>;
