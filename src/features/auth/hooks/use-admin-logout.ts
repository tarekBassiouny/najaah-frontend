import { logoutAdmin } from "@/services/admin-auth.service";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

type UseAdminLogoutOptions = Omit<
  UseMutationOptions<void, unknown, void>,
  "mutationKey" | "mutationFn"
>;

export function useAdminLogout(options?: UseAdminLogoutOptions) {
  return useMutation({
    mutationKey: ["admin", "logout"],
    mutationFn: () => logoutAdmin(),
    ...options,
  });
}
