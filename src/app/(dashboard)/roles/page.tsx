import { PageHeader } from "@/components/ui/page-header";
import { RolesTable } from "@/features/roles/components/RolesTable";

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and their access levels"
      />

      <RolesTable />
    </div>
  );
}
