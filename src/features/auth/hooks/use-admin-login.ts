import { loginAdmin } from "@/services/admin-auth.service";
import { type AdminLoginPayload, type AdminUser } from "@/types/auth";
import {
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query";

type UseAdminLoginOptions = Omit<
  UseMutationOptions<AdminUser, unknown, AdminLoginPayload>,
  "mutationFn"
>;

export function useAdminLogin(options?: UseAdminLoginOptions) {
  return useMutation({
    mutationKey: ["admin", "login"],
    mutationFn: loginAdmin,
    ...options,
  });
}
