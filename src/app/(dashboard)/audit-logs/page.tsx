import { PageHeader } from "@/components/ui/page-header";
import { AuditLogsTable } from "@/features/audit-logs/components/AuditLogsTable";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Read-only audit trail for admin activity."
      />
      <AuditLogsTable />
    </div>
  );
}
