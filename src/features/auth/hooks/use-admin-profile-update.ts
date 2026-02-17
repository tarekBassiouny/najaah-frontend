import { updateAdminProfile } from "@/services/admin-auth.service";
import type { AdminProfileUpdatePayload, AdminUser } from "@/types/auth";
import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type UseUpdateAdminProfileOptions = Omit<
  UseMutationOptions<AdminUser, unknown, AdminProfileUpdatePayload>,
  "mutationFn"
>;

export function useUpdateAdminProfile(options?: UseUpdateAdminProfileOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["admin", "profile", "update"],
    mutationFn: updateAdminProfile,
    ...options,
    onSuccess: (updatedUser, ...args) => {
      queryClient.setQueryData(["admin", "me"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
      options?.onSuccess?.(updatedUser, ...args);
    },
  });
}
