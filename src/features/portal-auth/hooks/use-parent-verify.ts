import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parentVerify } from "../services/portal-auth.service";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import { schedulePortalTokenRefresh } from "@/lib/portal-token-refresh";
import { getPortalMeQueryKey } from "./use-portal-me";
import type {
  VerifyOtpRequest,
  ParentVerifyResponse,
} from "../types/portal-auth";

export function useParentVerify() {
  const queryClient = useQueryClient();

  return useMutation<ParentVerifyResponse, Error, VerifyOtpRequest>({
    mutationFn: parentVerify,
    onSuccess: (data) => {
      portalTokenStorage.setActiveRole("parent");
      portalTokenStorage.setTokens({
        accessToken: data.token.access_token,
        refreshToken: data.token.refresh_token,
      });
      schedulePortalTokenRefresh();
      queryClient.setQueryData(getPortalMeQueryKey("parent"), data.data);
    },
  });
}
