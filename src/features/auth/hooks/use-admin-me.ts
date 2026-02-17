import { fetchAdminProfile } from "@/services/admin-auth.service";
import { tokenStorage } from "@/lib/token-storage";
import { useTenant } from "@/app/tenant-provider";
import { type AdminUser } from "@/types/auth";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";

type UseAdminMeOptions = Omit<
  UseQueryOptions<AdminUser | null>,
  "queryKey" | "queryFn"
>;

export function useAdminMe(options?: UseAdminMeOptions) {
  const hasToken = Boolean(tokenStorage.getAccessToken());
  const { isResolved } = useTenant();

  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: fetchAdminProfile,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    enabled: hasToken && isResolved,
    ...options,
  });
}
