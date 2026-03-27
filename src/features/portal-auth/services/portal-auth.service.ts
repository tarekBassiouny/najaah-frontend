import { portalHttp } from "@/lib/portal-http";
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  StudentVerifyResponse,
  ParentVerifyResponse,
  ParentRegisterRequest,
  ParentRegisterResponse,
  StudentProfile,
  ParentProfile,
} from "../types/portal-auth";

// ── Student auth ──

export async function studentSendOtp(
  body: SendOtpRequest,
): Promise<SendOtpResponse> {
  const { data } = await portalHttp.post<SendOtpResponse>(
    "/api/v1/web/auth/student/send-otp",
    body,
  );
  return data;
}

export async function studentVerify(
  body: VerifyOtpRequest,
): Promise<StudentVerifyResponse> {
  const { data } = await portalHttp.post<StudentVerifyResponse>(
    "/api/v1/web/auth/student/verify",
    body,
  );
  return data;
}

export async function studentRefreshToken(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const { data } = await portalHttp.post<{
    success: boolean;
    token: { access_token: string; refresh_token: string };
  }>("/api/v1/web/auth/student/refresh", { refresh_token: refreshToken });
  return data.token;
}

export async function fetchStudentProfile(): Promise<StudentProfile | null> {
  try {
    const { data } = await portalHttp.get<{
      success: boolean;
      data: StudentProfile;
    }>("/api/v1/web/auth/student/me");
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function studentLogout(): Promise<void> {
  await portalHttp.post("/api/v1/web/auth/student/logout");
}

// ── Parent auth ──

export async function parentRegister(
  body: ParentRegisterRequest,
): Promise<ParentRegisterResponse> {
  const { data } = await portalHttp.post<ParentRegisterResponse>(
    "/api/v1/web/auth/parent/register",
    body,
  );
  return data;
}

export async function parentSendOtp(
  body: SendOtpRequest,
): Promise<SendOtpResponse> {
  const { data } = await portalHttp.post<SendOtpResponse>(
    "/api/v1/web/auth/parent/send-otp",
    body,
  );
  return data;
}

export async function parentVerify(
  body: VerifyOtpRequest,
): Promise<ParentVerifyResponse> {
  const { data } = await portalHttp.post<ParentVerifyResponse>(
    "/api/v1/web/auth/parent/verify",
    body,
  );
  return data;
}

export async function fetchParentProfile(): Promise<ParentProfile | null> {
  try {
    const { data } = await portalHttp.get<{
      success: boolean;
      data: ParentProfile;
    }>("/api/v1/web/auth/parent/me");
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function parentLogout(): Promise<void> {
  await portalHttp.post("/api/v1/web/auth/parent/logout");
}
