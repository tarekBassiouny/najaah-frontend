"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AuditLogsTable } from "@/features/audit-logs/components/AuditLogsTable";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterAuditLogsPage({ params }: PageProps) {
  const { centerId } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Read-only audit trail for center activity."
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Audit Logs" },
        ]}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        }
      />
      <AuditLogsTable scopeCenterId={centerId} />
    </div>
  );
}
