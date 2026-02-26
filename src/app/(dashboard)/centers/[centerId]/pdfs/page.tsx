"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PdfsTable } from "@/features/pdfs/components/PdfsTable";
import { PdfDetailsDrawer } from "@/features/pdfs/components/PdfDetailsDrawer";
import { DeletePdfDialog } from "@/features/pdfs/components/DeletePdfDialog";
import { PdfUploadDialog } from "@/features/pdfs/components/PdfUploadDialog";
import type { Pdf } from "@/features/pdfs/types/pdf";
import { useModal } from "@/components/ui/modal-store";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterPdfsPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { showToast } = useModal();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<Pdf | null>(null);
  const [viewingPdf, setViewingPdf] = useState<Pdf | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<Pdf | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center PDFs"
        description="Manage PDFs for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "PDFs" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              Upload PDF
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          </div>
        }
      />
      <PdfsTable
        centerId={centerId}
        onView={(pdf) => setViewingPdf(pdf)}
        onEdit={(pdf) => setEditingPdf(pdf)}
        onDelete={(pdf) => setDeletingPdf(pdf)}
      />
      <PdfUploadDialog
        centerId={centerId}
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />
      <PdfUploadDialog
        centerId={centerId}
        open={Boolean(editingPdf)}
        pdf={editingPdf}
        onOpenChange={(open) => {
          if (!open) setEditingPdf(null);
        }}
      />
      <PdfDetailsDrawer
        open={Boolean(viewingPdf)}
        pdf={viewingPdf}
        onOpenChange={(open) => {
          if (!open) setViewingPdf(null);
        }}
      />
      <DeletePdfDialog
        open={Boolean(deletingPdf)}
        centerId={centerId}
        pdf={deletingPdf}
        onOpenChange={(open) => {
          if (!open) setDeletingPdf(null);
        }}
        onSuccess={(message) => showToast(message, "success")}
      />
    </div>
  );
}
