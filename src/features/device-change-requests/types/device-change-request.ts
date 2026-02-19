export type DeviceChangeRequest = {
  id: number | string;
  status?: string | null;
  user_id?: number | string | null;
  center_id?: number | string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type DeviceChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PRE_APPROVED";

export type DeviceChangeRequestSource = "MOBILE" | "OTP" | "ADMIN";

export type ListDeviceChangeRequestsParams = {
  page?: number;
  per_page?: number;
  center_id?: number | string;
  status?: DeviceChangeRequestStatus | string;
  search?: string;
  user_id?: number | string;
  request_source?: DeviceChangeRequestSource | string;
  decided_by?: number | string;
  current_device_id?: string;
  new_device_id?: string;
  date_from?: string;
  date_to?: string;
};

export type ApproveDeviceChangeRequestPayload = {
  new_device_id?: string;
  new_model?: string;
  new_os_version?: string;
};

export type RejectDeviceChangeRequestPayload = {
  decision_reason: string;
};

export type PreApproveDeviceChangeRequestPayload = {
  decision_reason?: string;
};

export type CreateDeviceChangeRequestPayload = {
  reason: string;
  device_uuid?: string;
  device_name?: string;
  device_os?: string;
  device_type?: string;
  [key: string]: unknown;
};

export type BulkApproveDeviceChangeRequestsPayload = {
  request_ids: Array<string | number>;
  new_device_id?: string;
  new_model?: string;
  new_os_version?: string;
};

export type BulkRejectDeviceChangeRequestsPayload = {
  request_ids: Array<string | number>;
  decision_reason: string;
};

export type BulkPreApproveDeviceChangeRequestsPayload = {
  request_ids: Array<string | number>;
  decision_reason?: string;
};

export type DeviceChangeBulkActionResult = {
  counts?: Record<string, number | string | null | undefined>;
  approved?: Array<Record<string, unknown>>;
  rejected?: Array<Record<string, unknown>>;
  pre_approved?: Array<Record<string, unknown>>;
  skipped?: Array<Record<string, unknown>>;
  failed?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};
