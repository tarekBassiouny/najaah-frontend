"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CentersTable } from "@/features/centers/components/CentersTable";
import { UpdateCenterStatusDialog } from "@/features/centers/components/UpdateCenterStatusDialog";
import { BulkUpdateCenterStatusDialog } from "@/features/centers/components/BulkUpdateCenterStatusDialog";
import { DeleteCenterDialog } from "@/features/centers/components/DeleteCenterDialog";
import { RestoreCenterDialog } from "@/features/centers/components/RestoreCenterDialog";
import { RetryCenterOnboardingDialog } from "@/features/centers/components/RetryCenterOnboardingDialog";
import { BulkDeleteCentersDialog } from "@/features/centers/components/BulkDeleteCentersDialog";
import { BulkRestoreCentersDialog } from "@/features/centers/components/BulkRestoreCentersDialog";
import { BulkRetryCenterOnboardingDialog } from "@/features/centers/components/BulkRetryCenterOnboardingDialog";
import type { Center } from "@/features/centers/types/center";

export default function CentersListPage() {
  const [statusCenter, setStatusCenter] = useState<Center | null>(null);
  const [deleteCenter, setDeleteCenter] = useState<Center | null>(null);
  const [restoreCenter, setRestoreCenter] = useState<Center | null>(null);
  const [retryCenter, setRetryCenter] = useState<Center | null>(null);
  const [bulkStatusCenters, setBulkStatusCenters] = useState<Center[]>([]);
  const [bulkDeleteCenters, setBulkDeleteCenters] = useState<Center[]>([]);
  const [bulkRestoreCenters, setBulkRestoreCenters] = useState<Center[]>([]);
  const [bulkRetryCenters, setBulkRetryCenters] = useState<Center[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centers"
        description="Manage training centers across your platform"
        actions={
          <Link href="/centers/create">
            <Button>Add Center</Button>
          </Link>
        }
      />

      <CentersTable
        onChangeStatus={(center) => setStatusCenter(center)}
        onDelete={(center) => setDeleteCenter(center)}
        onRestore={(center) => setRestoreCenter(center)}
        onRetryOnboarding={(center) => setRetryCenter(center)}
        onBulkChangeStatus={(centers) => setBulkStatusCenters(centers)}
        onBulkDelete={(centers) => setBulkDeleteCenters(centers)}
        onBulkRestore={(centers) => setBulkRestoreCenters(centers)}
        onBulkRetryOnboarding={(centers) => setBulkRetryCenters(centers)}
      />

      <UpdateCenterStatusDialog
        open={Boolean(statusCenter)}
        onOpenChange={(open) => {
          if (!open) setStatusCenter(null);
        }}
        center={statusCenter}
      />

      <BulkUpdateCenterStatusDialog
        open={bulkStatusCenters.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusCenters([]);
        }}
        centers={bulkStatusCenters}
      />

      <DeleteCenterDialog
        open={Boolean(deleteCenter)}
        onOpenChange={(open) => {
          if (!open) setDeleteCenter(null);
        }}
        center={deleteCenter}
      />

      <RestoreCenterDialog
        open={Boolean(restoreCenter)}
        onOpenChange={(open) => {
          if (!open) setRestoreCenter(null);
        }}
        center={restoreCenter}
      />

      <RetryCenterOnboardingDialog
        open={Boolean(retryCenter)}
        onOpenChange={(open) => {
          if (!open) setRetryCenter(null);
        }}
        center={retryCenter}
      />

      <BulkDeleteCentersDialog
        open={bulkDeleteCenters.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteCenters([]);
        }}
        centers={bulkDeleteCenters}
      />

      <BulkRestoreCentersDialog
        open={bulkRestoreCenters.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkRestoreCenters([]);
        }}
        centers={bulkRestoreCenters}
      />

      <BulkRetryCenterOnboardingDialog
        open={bulkRetryCenters.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkRetryCenters([]);
        }}
        centers={bulkRetryCenters}
      />
    </div>
  );
}
