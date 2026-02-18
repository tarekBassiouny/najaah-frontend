import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkAssignRolePermissions,
  getRolePermissions,
  updateRolePermissions,
  type BulkAssignRolePermissionsPayload,
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
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
      queryClient.refetchQueries({
        queryKey: ["admin", "me"],
        type: "all",
      });
    },
  });

  return { roleQuery, updateMutation };
}

export function useBulkAssignRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignRolePermissionsPayload) =>
      bulkAssignRolePermissions(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
      queryClient.refetchQueries({
        queryKey: ["admin", "me"],
        type: "all",
      });
      result.roles.forEach((roleId) => {
        queryClient.invalidateQueries({
          queryKey: ["role-permissions", roleId],
        });
      });
    },
  });
}
