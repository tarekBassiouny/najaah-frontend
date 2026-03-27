import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentVerify } from "../services/portal-auth.service";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import { schedulePortalTokenRefresh } from "@/lib/portal-token-refresh";
import { getPortalMeQueryKey } from "./use-portal-me";
import type {
  VerifyOtpRequest,
  StudentVerifyResponse,
} from "../types/portal-auth";

const DEVICE_UUID_KEY = "portal_device_uuid";

export function useStudentVerify() {
  const queryClient = useQueryClient();

  return useMutation<StudentVerifyResponse, Error, VerifyOtpRequest>({
    mutationFn: studentVerify,
    onSuccess: (data) => {
      portalTokenStorage.setActiveRole("student");
      portalTokenStorage.setTokens({
        accessToken: data.token.access_token,
        refreshToken: data.token.refresh_token,
      });
      schedulePortalTokenRefresh();

      // Persist device UUID for future logins
      if (data.device_uuid && typeof window !== "undefined") {
        window.localStorage.setItem(DEVICE_UUID_KEY, data.device_uuid);
      }

      queryClient.setQueryData(getPortalMeQueryKey("student"), data.data);
    },
  });
}

export function getStoredDeviceUuid(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEVICE_UUID_KEY);
}
