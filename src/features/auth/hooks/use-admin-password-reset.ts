import { resetAdminPassword } from "@/services/admin-auth.service";
import type { AdminPasswordResetPayload } from "@/types/auth";
import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

type UseAdminPasswordResetOptions = Omit<
  UseMutationOptions<unknown, unknown, AdminPasswordResetPayload>,
  "mutationFn"
>;

export function useAdminPasswordReset(options?: UseAdminPasswordResetOptions) {
  return useMutation({
    mutationKey: ["admin", "password-reset"],
    mutationFn: resetAdminPassword,
    ...options,
  });
}
