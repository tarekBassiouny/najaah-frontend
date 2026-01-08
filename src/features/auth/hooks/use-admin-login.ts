import { fetchAdminProfile, loginAdmin } from "@/services/admin-auth.service";
import {
  type AdminAuthTokens,
  type AdminLoginPayload,
  type AdminUser,
} from "@/types/auth";
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type UseAdminLoginOptions = Omit<
  UseMutationOptions<
    { tokens: AdminAuthTokens; user: AdminUser | null },
    unknown,
    AdminLoginPayload
  >,
  "mutationFn"
>;

export function useAdminLogin(options?: UseAdminLoginOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["admin", "login"],
    mutationFn: loginAdmin,
    ...options,
    onSuccess: async (...args) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
      try {
        await queryClient.prefetchQuery({
          queryKey: ["admin", "me"],
          queryFn: fetchAdminProfile,
        });
      } catch {
        // Ignore prefetch errors; route guard will handle auth state.
      }
      options?.onSuccess?.(...args);
    },
  });
}
