import { PageHeader } from "@/components/ui/page-header";
import { StudentsTable } from "@/features/students/components/StudentsTable";

type PageProps = {
  searchParams?: {
    center_id?: string;
    page?: string;
    per_page?: string;
  };
};

export default function StudentsPage({ searchParams }: PageProps) {
  const centerId = searchParams?.center_id;
  const parsedPage = Number(searchParams?.page ?? 1);
  const parsedPerPage = Number(searchParams?.per_page ?? 10);
  const initialPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const initialPerPage =
    Number.isFinite(parsedPerPage) && parsedPerPage > 0 ? parsedPerPage : 10;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage enrolled students across your learning centers"
      />

      <StudentsTable
        centerId={centerId}
        initialPage={initialPage}
        initialPerPage={initialPerPage}
      />
    </div>
  );
}
