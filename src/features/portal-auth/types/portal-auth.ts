// ── Request types ──

export type SendOtpRequest = {
  phone: string;
  country_code: string;
};

export type VerifyOtpRequest = {
  otp: string;
  token: string;
  device_uuid?: string;
  device_name?: string;
  device_os?: string;
};

export type ParentRegisterRequest = {
  phone: string;
  country_code: string;
};

export type RefreshTokenRequest = {
  refresh_token: string;
};

// ── Response types ──

export type SendOtpResponse = {
  success: boolean;
  token: string;
};

export type ParentRegisterResponse = {
  success: boolean;
  token: string;
  auto_linked: boolean;
};

export type TokenPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type PortalUser = {
  id: number;
  name: string;
  phone: string;
  is_student: boolean;
  is_parent: boolean;
  center_id?: number | null;
};

export type StudentVerifyResponse = {
  success: boolean;
  data: PortalUser;
  token: TokenPayload;
  device_uuid: string;
};

export type ParentVerifyResponse = {
  success: boolean;
  data: PortalUser;
  token: TokenPayload;
  device_uuid: string;
};

export type RefreshTokenResponse = {
  success: boolean;
  token: TokenPayload;
};

export type LinkedStudent = {
  id: number;
  name: string;
  link_status: string;
};

export type StudentProfile = PortalUser & {
  is_student: true;
};

export type ParentProfile = PortalUser & {
  is_parent: true;
  linked_students: LinkedStudent[];
};

export type PortalRole = "student" | "parent";

// ── Error codes ──

export type PortalAuthErrorCode =
  | "INVALID_API_KEY"
  | "CENTER_INACTIVE"
  | "OTP_INVALID"
  | "USER_NOT_FOUND_FOR_OTP"
  | "NOT_STUDENT"
  | "UNAUTHORIZED"
  | "CENTER_MISMATCH"
  | "STUDENT_INACTIVE"
  | "STUDENT_BANNED"
  | "WEB_ACCESS_DISABLED"
  | "PARENT_PORTAL_DISABLED"
  | "WEB_DEVICE_LIMIT_REACHED";
