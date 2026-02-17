import { changeAdminPassword } from "@/services/admin-auth.service";
import type { AdminChangePasswordPayload } from "@/types/auth";
import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

type UseAdminChangePasswordOptions = Omit<
  UseMutationOptions<unknown, unknown, AdminChangePasswordPayload>,
  "mutationFn"
>;

export function useAdminChangePassword(
  options?: UseAdminChangePasswordOptions,
) {
  return useMutation({
    mutationKey: ["admin", "change-password"],
    mutationFn: changeAdminPassword,
    ...options,
  });
}
