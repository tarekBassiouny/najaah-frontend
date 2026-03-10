"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/localization";
import { AuditLogsTable } from "@/features/audit-logs/components/AuditLogsTable";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterAuditLogsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.auditLogs.title")}
        description={t("pages.centerAuditLogs.description")}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">
              {t("pages.centerCourses.backToCenter")}
            </Button>
          </Link>
        }
      />
      <AuditLogsTable scopeCenterId={centerId} />
    </div>
  );
}
