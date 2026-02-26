"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/app/tenant-provider";
import { useModal } from "@/components/ui/modal-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PdfUploadDialog } from "@/features/pdfs/components/PdfUploadDialog";
import { PdfDetailsDrawer } from "@/features/pdfs/components/PdfDetailsDrawer";
import { DeletePdfDialog } from "@/features/pdfs/components/DeletePdfDialog";
import { PdfsTable } from "@/features/pdfs/components/PdfsTable";
import type { Pdf } from "@/features/pdfs/types/pdf";

export default function PdfsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId ?? null;
  const { showToast } = useModal();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<Pdf | null>(null);
  const [viewingPdf, setViewingPdf] = useState<Pdf | null>(null);
  const [deletingPdf, setDeletingPdf] = useState<Pdf | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const openUploadDialog = () => {
    if (!centerId) {
      setInfoModal({
        title: "Select a center",
        description: "Choose a center before uploading PDFs.",
      });
      return;
    }

    setIsUploadDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PDFs"
        description="Manage PDF documents for your learning center"
        actions={<Button onClick={openUploadDialog}>Upload PDF</Button>}
      />

      <PdfsTable
        onView={(pdf) => setViewingPdf(pdf)}
        onEdit={(pdf) => setEditingPdf(pdf)}
        onDelete={(pdf) => setDeletingPdf(pdf)}
      />

      {centerId ? (
        <>
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
          <DeletePdfDialog
            open={Boolean(deletingPdf)}
            centerId={centerId}
            pdf={deletingPdf}
            onOpenChange={(open) => {
              if (!open) setDeletingPdf(null);
            }}
            onSuccess={(message) => showToast(message, "success")}
          />
        </>
      ) : null}

      <PdfDetailsDrawer
        open={Boolean(viewingPdf)}
        pdf={viewingPdf}
        onOpenChange={(open) => {
          if (!open) setViewingPdf(null);
        }}
      />

      <Dialog
        open={Boolean(infoModal)}
        onOpenChange={(open) => {
          if (!open) setInfoModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{infoModal?.title ?? "Action"}</DialogTitle>
            <DialogDescription>
              {infoModal?.description ?? "This action is not available yet."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
