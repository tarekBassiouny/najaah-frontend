"use client";

import { useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/ui/modal-store";
import { PageHeader } from "@/components/ui/page-header";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { RoleFormDialog } from "@/features/roles/components/RoleFormDialog";
import { RolesTable } from "@/features/roles/components/RolesTable";
import { isSystemScopeUser } from "@/lib/admin-scope";
import type { Role } from "@/features/roles/types/role";

export default function RolesPage() {
  const { centerSlug } = useTenant();
  const { data: user } = useAdminMe();
  const { showToast } = useModal();
  const canManageWrite = isSystemScopeUser(user, !centerSlug);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description={
          canManageWrite
            ? "Manage user roles and their access levels."
            : "View roles and permissions. Updates require system-scoped access."
        }
        actions={
          canManageWrite ? (
            <Button
              onClick={() => {
                setEditingRole(null);
                setFormOpen(true);
              }}
            >
              Add Role
            </Button>
          ) : undefined
        }
      />

      <RolesTable
        canManageWrite={canManageWrite}
        onEdit={
          canManageWrite
            ? (role) => {
                setEditingRole(role);
                setFormOpen(true);
              }
            : undefined
        }
      />

      <RoleFormDialog
        open={formOpen}
        onOpenChange={(nextOpen) => {
          setFormOpen(nextOpen);
          if (!nextOpen) {
            setEditingRole(null);
          }
        }}
        role={editingRole}
        onSuccess={(message) => {
          showToast(message, "success");
        }}
      />
    </div>
  );
}
