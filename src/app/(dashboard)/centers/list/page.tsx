"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CentersTable } from "@/features/centers/components/CentersTable";
import { UpdateCenterStatusDialog } from "@/features/centers/components/UpdateCenterStatusDialog";
import { BulkUpdateCenterStatusDialog } from "@/features/centers/components/BulkUpdateCenterStatusDialog";
import type { Center } from "@/features/centers/types/center";

export default function CentersListPage() {
  const [statusCenter, setStatusCenter] = useState<Center | null>(null);
  const [bulkStatusCenters, setBulkStatusCenters] = useState<Center[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centers"
        description="Manage training centers across your platform"
        actions={
          <Link href="/centers/create">
            <Button>
              Add Center
            </Button>
          </Link>
        }
      />

      <CentersTable
        onToggleStatus={(center) => setStatusCenter(center)}
        onBulkChangeStatus={(centers) => setBulkStatusCenters(centers)}
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
    </div>
  );
}
