"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/app/tenant-provider";
import { useModal } from "@/components/ui/modal-store";
import { AdminUsersTable } from "@/features/admin-users/components/AdminUsersTable";
import { BulkAssignCentersDialog } from "@/features/admin-users/components/BulkAssignCentersDialog";
import { BulkAssignRolesDialog } from "@/features/admin-users/components/BulkAssignRolesDialog";
import { BulkUpdateAdminUserStatusDialog } from "@/features/admin-users/components/BulkUpdateAdminUserStatusDialog";
import { DeleteAdminUserDialog } from "@/features/admin-users/components/DeleteAdminUserDialog";
import { UpdateAdminUserStatusDialog } from "@/features/admin-users/components/UpdateAdminUserStatusDialog";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

export default function AdminUsersPage() {
  const { openModal } = useModal();
  const { centerSlug } = useTenant();
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [bulkAssignRolesUsers, setBulkAssignRolesUsers] = useState<AdminUser[]>(
    [],
  );
  const [bulkAssignCentersUsers, setBulkAssignCentersUsers] = useState<
    AdminUser[]
  >([]);
  const [bulkStatusUsers, setBulkStatusUsers] = useState<AdminUser[]>([]);

  const openCreateAdmin = () => {
    openModal("editAdmin", {
      onCreated: (createdUser: AdminUser) => {
        openModal("assignRoles", {
          user: createdUser,
          initialRoleIds: [],
          onContinue: ({
            selectedRoleIds,
            addedRoles,
          }: {
            selectedRoleIds: string[];
            addedRoles: string[];
            removedRoles: string[];
          }) => {
            if (!createdUser) return;
            openModal("confirmRoleChange", {
              userId: createdUser.id,
              userName: createdUser.name ?? "Admin User",
              email: createdUser.email ?? "",
              addedRoles,
              removedRoles: [],
              roleIds: selectedRoleIds,
            });
          },
        });
      },
    });
  };

  const openManageRoles = (user: AdminUser) => {
    openModal("assignRoles", {
      user,
      onContinue: ({
        selectedRoleIds,
        addedRoles,
        removedRoles,
      }: {
        selectedRoleIds: string[];
        addedRoles: string[];
        removedRoles: string[];
      }) => {
        openModal("confirmRoleChange", {
          userId: user.id,
          userName: user.name ?? "Admin User",
          email: user.email ?? "",
          addedRoles,
          removedRoles,
          roleIds: selectedRoleIds,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users"
        description="Manage system administrators and permissions"
        actions={<Button onClick={openCreateAdmin}>Add Admin</Button>}
      />

      <AdminUsersTable
        onEdit={(user) => openModal("editAdmin", { user })}
        onManageRoles={openManageRoles}
        onAssignCenters={
          centerSlug ? undefined : (user) => setBulkAssignCentersUsers([user])
        }
        onToggleStatus={centerSlug ? undefined : (user) => setStatusUser(user)}
        onDelete={(user) => setDeletingUser(user)}
        onBulkAssignRoles={
          centerSlug ? undefined : (users) => setBulkAssignRolesUsers(users)
        }
        onBulkAssignCenters={
          centerSlug ? undefined : (users) => setBulkAssignCentersUsers(users)
        }
        onBulkChangeStatus={
          centerSlug ? undefined : (users) => setBulkStatusUsers(users)
        }
      />

      <BulkAssignCentersDialog
        open={bulkAssignCentersUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkAssignCentersUsers([]);
        }}
        users={bulkAssignCentersUsers}
      />

      <BulkAssignRolesDialog
        open={bulkAssignRolesUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkAssignRolesUsers([]);
        }}
        users={bulkAssignRolesUsers}
      />

      <UpdateAdminUserStatusDialog
        open={Boolean(statusUser)}
        onOpenChange={(open) => {
          if (!open) setStatusUser(null);
        }}
        user={statusUser}
      />

      <BulkUpdateAdminUserStatusDialog
        open={bulkStatusUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusUsers([]);
        }}
        users={bulkStatusUsers}
      />

      <DeleteAdminUserDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
        user={deletingUser}
      />
    </div>
  );
}
