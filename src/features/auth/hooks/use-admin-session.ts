import { fetchAdminProfile } from "@/services/admin-auth.service";
import { type AdminUser } from "@/types/auth";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

type UseAdminSessionOptions = Omit<
  UseQueryOptions<AdminUser | null>,
  "queryKey" | "queryFn"
>;

export function useAdminSession(options?: UseAdminSessionOptions) {
  return useQuery({
    queryKey: ["admin", "session"],
    queryFn: fetchAdminProfile,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  });
}
