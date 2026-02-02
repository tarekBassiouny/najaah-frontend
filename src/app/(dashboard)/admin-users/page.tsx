import { PageHeader } from "@/components/ui/page-header";
import { AdminUsersTable } from "@/features/admin-users/components/AdminUsersTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users"
        description="Manage administrator accounts and their permissions"
      />

      <AdminUsersTable />
    </div>
  );
}
