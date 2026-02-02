import { PageHeader } from "@/components/ui/page-header";
import { StudentsTable } from "@/features/students/components/StudentsTable";

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage enrolled students across your learning centers"
      />

      <StudentsTable />
    </div>
  );
}
