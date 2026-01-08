import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRolePermissions,
  updateRolePermissions,
} from "../services/role-permissions.service";

export function useRolePermissions(roleId: string | number) {
  const queryClient = useQueryClient();

  const roleQuery = useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: () => getRolePermissions(roleId),
    enabled: Boolean(roleId),
  });

  const updateMutation = useMutation({
    mutationFn: (permissionIds: Array<number | string>) =>
      updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["role-permissions", roleId],
      });
    },
  });

  return { roleQuery, updateMutation };
}
