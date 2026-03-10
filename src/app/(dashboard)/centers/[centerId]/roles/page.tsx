"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/ui/modal-store";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "@/features/localization";
import { RoleFormDialog } from "@/features/roles/components/RoleFormDialog";
import { RolesTable } from "@/features/roles/components/RolesTable";
import { can } from "@/lib/capabilities";
import type { Role } from "@/features/roles/types/role";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterRolesPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);
  const { showToast } = useModal();
  const canManageWrite = can("manage_roles");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.rolesPage.title")}
        description={
          canManageWrite
            ? t("pages.centerRoles.descriptionWrite")
            : t("pages.centerRoles.descriptionReadOnly")
        }
        actions={
          <>
            {canManageWrite ? (
              <Button
                onClick={() => {
                  setEditingRole(null);
                  setFormOpen(true);
                }}
              >
                {t("pages.rolesPage.addRole")}
              </Button>
            ) : null}
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerCourses.backToCenter")}
              </Button>
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
