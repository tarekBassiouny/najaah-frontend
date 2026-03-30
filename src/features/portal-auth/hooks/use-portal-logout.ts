import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentLogout, parentLogout } from "../services/portal-auth.service";
import { portalTokenStorage } from "@/lib/portal-token-storage";
import { cancelPortalTokenRefresh } from "@/lib/portal-token-refresh";
import { getPortalMeQueryKey } from "./use-portal-me";
import type { PortalRole } from "../types/portal-auth";
import { clearPortalSessionQueries } from "../lib/clear-portal-session-queries";

export function usePortalLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PortalRole>({
    mutationFn: async (role) => {
      const hasAccessToken = Boolean(portalTokenStorage.getAccessToken());
      if (!hasAccessToken) {
        return;
      }

      if (role === "parent") {
        await parentLogout();
      } else {
        await studentLogout();
      }
    },
    onSettled: (_data, _error, role) => {
      portalTokenStorage.clear();
      cancelPortalTokenRefresh();
      const queryKey = getPortalMeQueryKey(role ?? "student");
      queryClient.setQueryData(queryKey, null);
      clearPortalSessionQueries(queryClient);
    },
  });
}
