"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Pdf } from "@/features/pdfs/types/pdf";
import { formatDateTime } from "@/lib/format-date-time";
import { getPdfSignedUrl } from "@/features/pdfs/services/pdfs.service";
import { useModal } from "@/components/ui/modal-store";
import { useTranslation } from "@/features/localization";

type PdfDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  pdf?: Pdf | null;
  centerId?: string | number;
  onEdit?: (_pdf: Pdf) => void;
  onDelete?: (_pdf: Pdf) => void;
};

function resolveStatus(
  status: string | number | null | undefined,
  labels: {
    pending: string;
    uploading: string;
    ready: string;
    failed: string;
    unknown: string;
    active: string;
  },
) {
  if (typeof status === "number") {
    if (status === 0)
      return { variant: "warning" as const, label: labels.pending };
    if (status === 1)
      return { variant: "warning" as const, label: labels.uploading };
    if (status === 2)
      return { variant: "success" as const, label: labels.ready };
    if (status === 3)
      return { variant: "error" as const, label: labels.failed };
    return { variant: "default" as const, label: String(status) };
  }

  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!normalized)
    return { variant: "default" as const, label: labels.unknown };
  if (normalized === "active" || normalized === "enabled") {
    return { variant: "success" as const, label: labels.active };
  }
  if (normalized === "pending" || normalized === "processing") {
    return { variant: "warning" as const, label: labels.pending };
  }
  if (normalized === "failed" || normalized === "error") {
    return { variant: "error" as const, label: labels.failed };
  }

  return {
    variant: "default" as const,
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
  };
}

function formatFileSize(pdf: Pdf | null | undefined, emptyValue: string) {
  if (!pdf) return emptyValue;
  if (typeof pdf.file_size_kb === "number") return `${pdf.file_size_kb} KB`;
  if (pdf.file_size_kb) return String(pdf.file_size_kb);
  if (typeof pdf.file_size === "number") return `${pdf.file_size} KB`;
  if (pdf.file_size) return String(pdf.file_size);
  return emptyValue;
}

function resolvePdfSourceType(pdf: Pdf | null | undefined): "upload" | "url" {
  const rawType = String(pdf?.source_type ?? "")
    .trim()
    .toLowerCase();

  if (rawType === "1" || rawType === "upload") {
    return "upload";
  }

  if (rawType === "0" || rawType === "url") {
    return "url";
  }

  return pdf?.source_url ? "url" : "upload";
}

function resolvePdfProviderLabel(
  pdf: Pdf | null | undefined,
  labels: { najaahApp: string; custom: string },
) {
  const rawProvider = String(pdf?.source_provider ?? "")
    .trim()
    .toLowerCase();

  if (rawProvider === "spaces") {
    return labels.najaahApp;
  }

  if (rawProvider === "custom") {
    return labels.custom;
  }

  if (rawProvider) {
    return rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1);
  }

  return resolvePdfSourceType(pdf) === "upload"
    ? labels.najaahApp
    : labels.custom;
}

export function PdfDetailsDrawer({
  open,
  onOpenChange,
  pdf,
  centerId,
  onEdit,
  onDelete,
}: PdfDetailsDrawerProps) {
  const { t } = useTranslation();
  const { showToast } = useModal();
  const emptyValue = t("pages.pdfs.dialogs.details.emptyValue");
  const title =
    pdf?.title ??
    pdf?.title_translations?.en ??
    pdf?.title_translations?.ar ??
    t("pages.pdfs.dialogs.details.titleFallback");
  const description =
    pdf?.description ??
    pdf?.description_translations?.en ??
    pdf?.description_translations?.ar ??
    t("pages.pdfs.dialogs.details.descriptionFallback");
  const status = resolveStatus(pdf?.upload_status ?? pdf?.status, {
    pending: t("pages.pdfs.dialogs.details.status.pending"),
    uploading: t("pages.pdfs.dialogs.details.status.uploading"),
    ready: t("pages.pdfs.dialogs.details.status.ready"),
    failed: t("pages.pdfs.dialogs.details.status.failed"),
    unknown: t("pages.pdfs.dialogs.details.status.unknown"),
    active: t("pages.pdfs.dialogs.details.status.active"),
  });
  const sourceType = resolvePdfSourceType(pdf);
  const providerLabel = resolvePdfProviderLabel(pdf, {
    najaahApp: t("pages.pdfs.table.filters.najaahApp"),
    custom: t("pages.pdfs.table.filters.custom"),
  });
  const canUseSignedUrl = Boolean(centerId && pdf?.source_id);

  const handlePreview = async () => {
    if (!centerId || !pdf) return;
    try {
      const { url } = await getPdfSignedUrl(centerId, pdf.id, "inline");
      window.open(url, "_blank");
    } catch {
      showToast(t("pages.pdfs.table.actions.previewFailed"), "error");
    }
  };

  const handleDownload = async () => {
    if (!centerId || !pdf) return;
    try {
      const { url } = await getPdfSignedUrl(centerId, pdf.id, "attachment");
      const link = document.createElement("a");
      link.href = url;
      link.download =
        pdf.title ?? t("pages.pdfs.dialogs.details.defaultFilename");
      link.click();
    } catch {
      showToast(t("pages.pdfs.table.actions.downloadFailed"), "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 inset-y-0 left-auto right-0 flex h-dvh max-h-none w-full max-w-[540px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:max-h-none sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-gray-200 p-6 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {canUseSignedUrl || onEdit || onDelete ? (
              <div className="flex flex-wrap gap-2 pt-3">
                {canUseSignedUrl ? (
                  <>
                    <Button size="sm" variant="outline" onClick={handlePreview}>
                      {t("pages.pdfs.table.actions.preview")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownload}
                    >
                      {t("common.actions.download")}
                    </Button>
                  </>
                ) : null}
                {onEdit && pdf ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onEdit(pdf);
                      onOpenChange(false);
                    }}
                  >
                    {t("common.actions.edit")}
                  </Button>
                ) : null}
                {onDelete && pdf ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => {
                      onDelete(pdf);
                      onOpenChange(false);
                    }}
                  >
                    {t("common.actions.delete")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.pdfs.dialogs.details.sections.metadata")}
                </h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.dialogs.details.fields.id")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.id != null ? String(pdf.id) : emptyValue}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.dialogs.details.fields.fileType")}
                  </p>
                  <p className="break-words text-base font-semibold uppercase text-gray-900 dark:text-white">
                    {pdf?.file_extension
                      ? String(pdf.file_extension)
                      : t("pages.pdfs.dialogs.details.defaultFileType")}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.dialogs.details.fields.sourceType")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {t(`pages.pdfs.table.sourceMode.${sourceType}`)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.table.headers.provider")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {providerLabel}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.table.headers.size")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(pdf, emptyValue)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.table.headers.uploadedBy")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.creator?.name ?? emptyValue}
                  </p>
                </div>
              </div>
            </section>

            {typeof pdf?.courses_count === "number" ||
            typeof pdf?.sections_count === "number" ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.pdfs.dialogs.details.sections.usage")}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {typeof pdf?.courses_count === "number" ? (
                    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                      <p className="text-xs text-gray-500">
                        {t("pages.pdfs.dialogs.details.fields.courses")}
                      </p>
                      <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                        {pdf.courses_count}{" "}
                        {pdf.courses_count === 1
                          ? t("pages.pdfs.table.usage.course")
                          : t("pages.pdfs.table.usage.courses")}
                      </p>
                    </div>
                  ) : null}
                  {typeof pdf?.sections_count === "number" ? (
                    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                      <p className="text-xs text-gray-500">
                        {t("pages.pdfs.dialogs.details.fields.sections")}
                      </p>
                      <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                        {pdf.sections_count}{" "}
                        {pdf.sections_count === 1
                          ? t("pages.pdfs.dialogs.details.sectionSingle")
                          : t("pages.pdfs.dialogs.details.sectionPlural")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("pages.pdfs.dialogs.details.sections.timeline")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.dialogs.details.fields.createdAt")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.created_at
                      ? formatDateTime(pdf.created_at)
                      : emptyValue}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">
                    {t("pages.pdfs.dialogs.details.fields.updatedAt")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {pdf?.updated_at
                      ? formatDateTime(pdf.updated_at)
                      : emptyValue}
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
