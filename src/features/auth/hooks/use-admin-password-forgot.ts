import { forgotAdminPassword } from "@/services/admin-auth.service";
import type { AdminPasswordForgotPayload } from "@/types/auth";
import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

type UseAdminPasswordForgotOptions = Omit<
  UseMutationOptions<unknown, unknown, AdminPasswordForgotPayload>,
  "mutationFn"
>;

export function useAdminPasswordForgot(
  options?: UseAdminPasswordForgotOptions,
) {
  return useMutation({
    mutationKey: ["admin", "password-forgot"],
    mutationFn: forgotAdminPassword,
    ...options,
  });
}
