"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Pdf } from "@/features/pdfs/types/pdf";
import { formatDateTime } from "@/lib/format-date-time";

type PdfDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  pdf?: Pdf | null;
};

function resolveStatus(status: string | number | null | undefined) {
  if (typeof status === "number") {
    if (status === 0) return { variant: "warning" as const, label: "Pending" };
    if (status === 1)
      return { variant: "warning" as const, label: "Uploading" };
    if (status === 2) return { variant: "success" as const, label: "Ready" };
    if (status === 3) return { variant: "error" as const, label: "Failed" };
    return { variant: "default" as const, label: String(status) };
  }

  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return { variant: "default" as const, label: "Unknown" };
  if (normalized === "active" || normalized === "enabled") {
    return { variant: "success" as const, label: "Active" };
  }
  if (normalized === "pending" || normalized === "processing") {
    return { variant: "warning" as const, label: "Pending" };
  }
  if (normalized === "failed" || normalized === "error") {
    return { variant: "error" as const, label: "Failed" };
  }

  return {
    variant: "default" as const,
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
  };
}

function formatFileSize(pdf: Pdf | null | undefined) {
  if (!pdf) return "—";
  if (typeof pdf.file_size_kb === "number") return `${pdf.file_size_kb} KB`;
  if (pdf.file_size_kb) return String(pdf.file_size_kb);
  if (typeof pdf.file_size === "number") return `${pdf.file_size} KB`;
  if (pdf.file_size) return String(pdf.file_size);
  return "—";
}

export function PdfDetailsDrawer({
  open,
  onOpenChange,
  pdf,
}: PdfDetailsDrawerProps) {
  const title =
    pdf?.title ??
    pdf?.title_translations?.en ??
    pdf?.title_translations?.ar ??
    "PDF details";
  const description =
    pdf?.description ??
    pdf?.description_translations?.en ??
    pdf?.description_translations?.ar ??
    "No description";
  const status = resolveStatus(pdf?.upload_status ?? pdf?.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 inset-y-0 left-auto right-0 flex h-dvh max-h-none w-full max-w-[540px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:max-h-none sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-gray-200 p-6 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Metadata
                </h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.id != null ? String(pdf.id) : "—"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">File Type</p>
                  <p className="break-words text-base font-semibold uppercase text-gray-900 dark:text-white">
                    {pdf?.file_extension ? String(pdf.file_extension) : "PDF"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">File Size</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(pdf)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Uploaded By</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.creator?.name ?? "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Timeline
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.created_at ? formatDateTime(pdf.created_at) : "—"}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">Updated At</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.updated_at ? formatDateTime(pdf.updated_at) : "—"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
