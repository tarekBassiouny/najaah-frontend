import { PageHeader } from "@/components/ui/page-header";
import { VideosTable } from "@/features/videos/components/VideosTable";

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        description="Manage video content for your learning center"
      />

      <VideosTable />
    </div>
  );
}
