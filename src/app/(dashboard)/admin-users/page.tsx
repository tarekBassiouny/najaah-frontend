"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AdminUsersTable } from "@/features/admin-users/components/AdminUsersTable";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import { useState } from "react";
import { useModal } from "@/components/ui/modal-store";
import { DeleteAdminUserDialog } from "@/features/admin-users/components/DeleteAdminUserDialog";

export default function AdminUsersPage() {
  const { openModal, showToast } = useModal();
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

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
        onAssignCenters={() => {
          showToast("Assign centers not implemented yet.", "error");
        }}
        onToggleStatus={() => {
          showToast("Status update not implemented yet.", "error");
        }}
        onDelete={(user) => setDeletingUser(user)}
        onBulkAssignRoles={(_users) => {
          showToast("Bulk role assignment not implemented yet.", "error");
        }}
        onBulkAssignCenters={(_users) => {
          showToast("Bulk center assignment not implemented yet.", "error");
        }}
        onBulkChangeStatus={(_users) => {
          showToast("Bulk status changes not implemented yet.", "error");
        }}
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
