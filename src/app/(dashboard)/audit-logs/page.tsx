"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useTranslation } from "@/features/localization";
import { AuditLogsTable } from "@/features/audit-logs/components/AuditLogsTable";

export default function AuditLogsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.auditLogs.title")}
        description={t("pages.auditLogs.descriptionAdmin")}
      />
      <AuditLogsTable />
    </div>
  );
}
