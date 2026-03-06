export type VideoAccessWhatsappFormat = "text_code" | "qr_code";

export type VideoAccessRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | string;

export type VideoAccessCodeStatus =
  | "active"
  | "used"
  | "revoked"
  | "expired"
  | string;

export type VideoAccessRequestUser = {
  id?: number | string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type VideoAccessRequestCourse = {
  id?: number | string | null;
  title?: string | null;
  name?: string | null;
};

export type VideoAccessRequestVideo = {
  id?: number | string | null;
  title?: string | null;
};

export type VideoAccessRequestCenter = {
  id?: number | string | null;
  name?: string | null;
};

export type VideoAccessRequestDecider = {
  id?: number | string | null;
  name?: string | null;
};

export type VideoAccessRequest = {
  id: number | string;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
  user_id?: number | string | null;
  center_id?: number | string | null;
  course_id?: number | string | null;
  video_id?: number | string | null;
  user?: VideoAccessRequestUser | null;
  student?: VideoAccessRequestUser | null;
  course?: VideoAccessRequestCourse | null;
  video?: VideoAccessRequestVideo | null;
  center?: VideoAccessRequestCenter | null;
  decider?: VideoAccessRequestDecider | null;
  decided_by?: VideoAccessRequestDecider | null;
  reason?: string | null;
  decision_reason?: string | null;
  requested_at?: string | null;
  decided_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type VideoAccessCode = {
  id: number | string;
  code?: string | null;
  status?: string | null;
  status_key?: string | null;
  status_label?: string | null;
  user_id?: number | string | null;
  center_id?: number | string | null;
  course_id?: number | string | null;
  video_id?: number | string | null;
  expires_at?: string | null;
  used_at?: string | null;
  revoked_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  qr_code_url?: string | null;
  user?: VideoAccessRequestUser | null;
  student?: VideoAccessRequestUser | null;
  course?: VideoAccessRequestCourse | null;
  video?: VideoAccessRequestVideo | null;
  center?: VideoAccessRequestCenter | null;
  generated_at?: string | null;
  generated_by?: VideoAccessRequestDecider | null;
  whatsapp_error?: string | null;
  [key: string]: unknown;
};

export type ListVideoAccessRequestsParams = {
  page?: number;
  per_page?: number;
  center_id?: number | string;
  status?: VideoAccessRequestStatus;
  user_id?: number | string;
  video_id?: number | string;
  course_id?: number | string;
  date_from?: string;
  date_to?: string;
  search?: string;
};

export type ListVideoAccessCodesParams = {
  page?: number;
  per_page?: number;
  center_id?: number | string;
  status?: VideoAccessCodeStatus;
  user_id?: number | string;
  video_id?: number | string;
  course_id?: number | string;
};

export type ApproveVideoAccessRequestPayload = {
  decision_reason?: string;
  send_whatsapp?: boolean;
  whatsapp_format?: VideoAccessWhatsappFormat;
};

export type RejectVideoAccessRequestPayload = {
  decision_reason: string;
};

export type BulkApproveVideoAccessRequestsPayload = {
  request_ids: Array<string | number>;
  decision_reason?: string;
  send_whatsapp?: boolean;
  whatsapp_format?: VideoAccessWhatsappFormat;
};

export type BulkRejectVideoAccessRequestsPayload = {
  request_ids: Array<string | number>;
  decision_reason: string;
};

export type VideoAccessBulkActionResult = {
  approved?: number;
  rejected?: number;
  total?: number;
  codes_generated?: number;
  whatsapp_sent?: number;
  whatsapp_failed?: number;
  counts?: Record<string, number | string | null | undefined>;
  results?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type GeneratedVideoAccessCode = VideoAccessCode & {
  whatsapp_sent?: boolean;
};

export type ApproveVideoAccessRequestResult = {
  request?: VideoAccessRequest | null;
  generated_code?: GeneratedVideoAccessCode | null;
  [key: string]: unknown;
};

export type GenerateVideoAccessCodePayload = {
  video_id: string | number;
  course_id: string | number;
  send_whatsapp: boolean;
};

export type SendVideoAccessCodeWhatsappPayload = {
  format: VideoAccessWhatsappFormat;
};

export type BulkSendVideoAccessCodesWhatsappPayload = {
  code_ids: Array<string | number>;
  format: VideoAccessWhatsappFormat;
};

export type BulkGenerateVideoAccessCodesPayload = {
  student_ids: Array<string | number>;
  course_id: string | number;
  video_id: string | number;
  send_whatsapp?: boolean;
  whatsapp_format?: VideoAccessWhatsappFormat;
};

export type BulkGenerateVideoAccessCodesResult = {
  counts?: {
    total?: number;
    generated?: number;
    failed?: number;
    whatsapp_sent?: number;
    whatsapp_failed?: number;
  };
  generated?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type BulkWhatsappJobSettings = {
  max_retries?: number | string | null;
  [key: string]: unknown;
};

export type BulkWhatsappJob = {
  id: string | number;
  job_id?: string | number | null;
  status?: string | null;
  status_key?: string | null;
  settings?: BulkWhatsappJobSettings | null;
  total_codes?: number | null;
  sent_count?: number | null;
  failed_count?: number | null;
  pending_count?: number | null;
  progress_percent?: number | null;
  estimated_minutes?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};
