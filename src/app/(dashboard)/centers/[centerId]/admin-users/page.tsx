"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/ui/modal-store";
import { AdminUsersTable } from "@/features/admin-users/components/AdminUsersTable";
import { BulkAssignRolesDialog } from "@/features/admin-users/components/BulkAssignRolesDialog";
import { BulkUpdateAdminUserStatusDialog } from "@/features/admin-users/components/BulkUpdateAdminUserStatusDialog";
import { DeleteAdminUserDialog } from "@/features/admin-users/components/DeleteAdminUserDialog";
import { UpdateAdminUserStatusDialog } from "@/features/admin-users/components/UpdateAdminUserStatusDialog";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterAdminUsersPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { openModal } = useModal();

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [bulkAssignRolesUsers, setBulkAssignRolesUsers] = useState<AdminUser[]>(
    [],
  );
  const [bulkStatusUsers, setBulkStatusUsers] = useState<AdminUser[]>([]);

  const openCreateAdmin = () => {
    openModal("editAdmin", {
      scopeCenterId: centerId,
      onCreated: (createdUser: AdminUser) => {
        openModal("assignRoles", {
          user: createdUser,
          scopeCenterId: centerId,
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
              scopeCenterId: centerId,
            });
          },
        });
      },
    });
  };

  const openManageRoles = (user: AdminUser) => {
    openModal("assignRoles", {
      user,
      scopeCenterId: centerId,
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
          scopeCenterId: centerId,
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users"
        description="Manage administrators and permissions for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Admins" },
        ]}
        actions={
          <>
            <Button onClick={openCreateAdmin}>Add Admin</Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          </>
        }
      />

      <AdminUsersTable
        scopeCenterId={centerId}
        showCenterFilter={false}
        onEdit={(user) =>
          openModal("editAdmin", { user, scopeCenterId: centerId })
        }
        onManageRoles={openManageRoles}
        onToggleStatus={(user) => setStatusUser(user)}
        onDelete={(user) => setDeletingUser(user)}
        onBulkAssignRoles={(users) => setBulkAssignRolesUsers(users)}
        onBulkChangeStatus={(users) => setBulkStatusUsers(users)}
      />

      <BulkAssignRolesDialog
        open={bulkAssignRolesUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkAssignRolesUsers([]);
        }}
        users={bulkAssignRolesUsers}
        scopeCenterId={centerId}
      />

      <UpdateAdminUserStatusDialog
        open={Boolean(statusUser)}
        onOpenChange={(open) => {
          if (!open) setStatusUser(null);
        }}
        user={statusUser}
        scopeCenterId={centerId}
      />

      <BulkUpdateAdminUserStatusDialog
        open={bulkStatusUsers.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusUsers([]);
        }}
        users={bulkStatusUsers}
        scopeCenterId={centerId}
      />

      <DeleteAdminUserDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
        user={deletingUser}
        scopeCenterId={centerId}
      />
    </div>
  );
}
