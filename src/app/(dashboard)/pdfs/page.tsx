import { PageHeader } from "@/components/ui/page-header";
import { PdfsTable } from "@/features/pdfs/components/PdfsTable";

export default function PdfsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="PDFs"
        description="Manage PDF documents for your learning center"
      />

      <PdfsTable />
    </div>
  );
}
