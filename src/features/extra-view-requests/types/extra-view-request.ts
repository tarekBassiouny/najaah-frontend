export type ExtraViewRequestUser = {
  id?: number | string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ExtraViewRequestCourse = {
  id?: number | string | null;
  name?: string | null;
  title?: string | null;
};

export type ExtraViewRequestVideo = {
  id?: number | string | null;
  title?: string | null;
};

export type ExtraViewRequestCenter = {
  id?: number | string | null;
  name?: string | null;
};

export type ExtraViewRequestDecider = {
  id?: number | string | null;
  name?: string | null;
};

export type ExtraViewRequest = {
  id: number | string;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
  user_id?: number | string | null;
  center_id?: number | string | null;
  course_id?: number | string | null;
  video_id?: number | string | null;
  user?: ExtraViewRequestUser | null;
  course?: ExtraViewRequestCourse | null;
  video?: ExtraViewRequestVideo | null;
  center?: ExtraViewRequestCenter | null;
  decider?: ExtraViewRequestDecider | null;
  decided_by?: ExtraViewRequestDecider | null;
  reason?: string | null;
  granted_views?: number | null;
  decision_reason?: string | null;
  decided_at?: string | null;
  requested_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type ExtraViewRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ListExtraViewRequestsParams = {
  page?: number;
  per_page?: number;
  center_id?: number | string;
  status?: ExtraViewRequestStatus | string;
  search?: string;
  user_id?: number | string;
  student_name?: string;
  student_phone?: string;
  course_id?: number | string;
  course_title?: string;
  video_id?: number | string;
  video_title?: string;
  decided_by?: number | string;
  requested_at_from?: string;
  requested_at_to?: string;
  date_from?: string;
  date_to?: string;
};

export type ApproveExtraViewRequestPayload = {
  granted_views: number;
  decision_reason?: string;
};

export type RejectExtraViewRequestPayload = {
  decision_reason?: string;
};

export type BulkApproveExtraViewRequestsPayload = {
  request_ids: Array<string | number>;
  granted_views: number;
  decision_reason?: string;
};

export type BulkRejectExtraViewRequestsPayload = {
  request_ids: Array<string | number>;
  decision_reason?: string;
};

export type ExtraViewBulkActionResult = {
  counts?: Record<string, number | string | null | undefined>;
  approved?: Array<Record<string, unknown>>;
  rejected?: Array<Record<string, unknown>>;
  granted?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type DirectGrantExtraViewPayload = {
  course_id: number | string;
  video_id: number | string;
  granted_views: number;
  reason?: string;
  decision_reason?: string;
};

export type BulkDirectGrantExtraViewPayload = {
  student_ids: Array<number | string>;
  course_id: number | string;
  video_id: number | string;
  granted_views: number;
  reason?: string;
  decision_reason?: string;
};

export type ExtraViewDirectGrantResult = {
  counts?: Record<string, number | string | null | undefined>;
  granted?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};
