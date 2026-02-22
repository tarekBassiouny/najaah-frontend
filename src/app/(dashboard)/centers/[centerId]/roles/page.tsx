"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/ui/modal-store";
import { PageHeader } from "@/components/ui/page-header";
import { RoleFormDialog } from "@/features/roles/components/RoleFormDialog";
import { RolesTable } from "@/features/roles/components/RolesTable";
import { can } from "@/lib/capabilities";
import type { Role } from "@/features/roles/types/role";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterRolesPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { showToast } = useModal();
  const canManageWrite = can("manage_roles");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description={
          canManageWrite
            ? "Manage user roles and access levels for this center."
            : "View roles and permissions. Updates require manage_roles permission."
        }
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Roles" },
        ]}
        actions={
          <>
            {canManageWrite ? (
              <Button
                onClick={() => {
                  setEditingRole(null);
                  setFormOpen(true);
                }}
              >
                Add Role
              </Button>
            ) : null}
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          </>
        }
      />

      <RolesTable
        scopeCenterId={centerId}
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
        scopeCenterId={centerId}
        onSuccess={(message) => {
          showToast(message, "success");
        }}
      />
    </div>
  );
}
