import { http } from "@/lib/http";
import {
  type AdminAuthResponse,
  type AdminLoginPayload,
  type AdminUser,
  type ApiErrorResponse,
} from "@/types/auth";
import { isAxiosError } from "axios";

function extractUser(payload: AdminAuthResponse | AdminUser): AdminUser {
  if ("user" in payload && payload.user) return payload.user;
  if ("data" in payload && payload.data) return payload.data;
  return payload as AdminUser;
}

export async function loginAdmin(payload: AdminLoginPayload) {
  const { data } = await http.post<AdminAuthResponse>(
    "/api/v1/admin/auth/login",
    payload,
  );
  return extractUser(data);
}

export async function fetchAdminProfile(): Promise<AdminUser | null> {
  try {
    const { data } = await http.get<AdminAuthResponse>(
      "/api/v1/admin/auth/me",
    );
    return extractUser(data);
  } catch (error) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      if (error.response?.status === 401) {
        return null;
      }
    }
    throw error;
  }
}

export async function logoutAdmin() {
  await http.post("/api/v1/admin/auth/logout");
}
