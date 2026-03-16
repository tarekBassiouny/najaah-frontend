"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/ui/stats-card";
import { useModal } from "@/components/ui/modal-store";
import { formatDateTime } from "@/lib/format-date-time";
import {
  useVideoCodeBatch,
  useVideoCodeBatchRedemptions,
  useVideoCodeBatchStatistics,
} from "@/features/video-code-batches/hooks/use-video-code-batches";
import { triggerBrowserDownload } from "@/features/video-code-batches/lib/download-file";
import { buildVideoCodeBatchExportFilename } from "@/features/video-code-batches/lib/export-filename";
import {
  exportVideoCodeBatchCsv,
  exportVideoCodeBatchPdf,
} from "@/features/video-code-batches/services/video-code-batches.service";
import { CloseVideoCodeBatchDialog } from "@/features/video-code-batches/components/CloseVideoCodeBatchDialog";
import { ExpandVideoCodeBatchDialog } from "@/features/video-code-batches/components/ExpandVideoCodeBatchDialog";
import { SendVideoCodeBatchWhatsappCsvDialog } from "@/features/video-code-batches/components/SendVideoCodeBatchWhatsappCsvDialog";
import type { VideoCodeBatchExportRecord } from "@/features/video-code-batches/types/video-code-batch";

type VideoCodeBatchDetailsPageProps = {
  centerId: string | number;
  batchId: string | number;
};

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function resolveStatusMeta(value: unknown) {
  const normalized = normalizeStatus(value);
  if (normalized === "open") {
    return { label: "Open", variant: "success" as const };
  }

  if (normalized === "closed") {
    return { label: "Closed", variant: "default" as const };
  }

  return {
    label:
      typeof value === "string" && value.trim().length > 0 ? value : "Unknown",
    variant: "secondary" as const,
  };
}

function resolveExportStatusMeta(status: unknown) {
  const normalized = normalizeStatus(status);

  if (normalized === "processing") {
    return { label: "Processing", variant: "warning" as const };
  }

  if (normalized === "sent" || normalized === "completed") {
    return {
      label: normalized === "sent" ? "Sent" : "Completed",
      variant: "success" as const,
    };
  }

  if (normalized === "failed") {
    return { label: "Failed", variant: "error" as const };
  }

  return {
    label:
      typeof status === "string" && status.trim().length > 0
        ? status
        : "Unknown",
    variant: "secondary" as const,
  };
}

function resolveExportTitle(record: VideoCodeBatchExportRecord) {
  if (record.type === "whatsapp_csv") return "WhatsApp CSV";
  if (record.format === "pdf") return "PDF Download";
  if (record.format === "csv") return "CSV Download";
  return "Export";
}

function resolveDeliveryChannelLabel(record: VideoCodeBatchExportRecord) {
  if (record.delivery_channel === "whatsapp") return "WhatsApp";
  if (record.delivery_channel === "download") return "Download";
  return null;
}

export function VideoCodeBatchDetailsPage({
  centerId,
  batchId,
}: VideoCodeBatchDetailsPageProps) {
  const { showToast } = useModal();
  const [redemptionsPage, setRedemptionsPage] = useState(1);
  const [redemptionsPerPage, setRedemptionsPerPage] = useState(15);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [downloadKey, setDownloadKey] = useState<string | null>(null);
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);

  const batchQuery = useVideoCodeBatch(centerId, batchId);
  const statsQuery = useVideoCodeBatchStatistics(centerId, batchId);
  const redemptionsQuery = useVideoCodeBatchRedemptions(
    centerId,
    batchId,
    {
      page: redemptionsPage,
      per_page: redemptionsPerPage,
      search: query || undefined,
    },
    {
      placeholderData: (previous) => previous,
    },
  );

  const batch = batchQuery.data;
  const stats = statsQuery.data;
  const redemptions = redemptionsQuery.data?.items ?? [];
  const totalRedemptions = redemptionsQuery.data?.meta.total ?? 0;
  const redemptionsLastPage = Math.max(
    1,
    Math.ceil(totalRedemptions / redemptionsPerPage),
  );
  const status = resolveStatusMeta(batch?.status_label ?? batch?.status);
  const exportsHistory = stats?.exports ?? batch?.metadata?.exports ?? [];
  const canExpand =
    batch?.can_expand ?? normalizeStatus(batch?.status) === "open";
  const canClose =
    batch?.can_close ?? normalizeStatus(batch?.status) === "open";
  const recentRedemptions = stats?.recent_redemptions ?? [];
  const hasProcessingWhatsappExport = exportsHistory.some(
    (record) =>
      record.delivery_channel === "whatsapp" &&
      normalizeStatus(record.status) === "processing",
  );

  useEffect(() => {
    if (!hasProcessingWhatsappExport) return;

    const intervalId = window.setInterval(() => {
      void statsQuery.refetch();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [hasProcessingWhatsappExport, statsQuery]);

  const handleExport = async (format: "csv" | "pdf") => {
    if (!batch) return;
    setDownloadKey(format);

    try {
      const response =
        format === "csv"
          ? await exportVideoCodeBatchCsv(centerId, batch.id)
          : await exportVideoCodeBatchPdf(centerId, batch.id);
      const fallbackName = buildVideoCodeBatchExportFilename(batch, format);
      triggerBrowserDownload(response.blob, response.filename ?? fallbackName);
      await Promise.all([
        batchQuery.refetch(),
        statsQuery.refetch(),
        redemptionsQuery.refetch(),
      ]);
      showToast(`${format.toUpperCase()} exported successfully.`, "success");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : `Failed to export ${format.toUpperCase()}.`,
        "error",
      );
    } finally {
      setDownloadKey(null);
    }
  };

  const statsCards = useMemo(() => {
    return [
      {
        title: "Total Codes",
        value: stats?.total_codes ?? batch?.quantity ?? 0,
      },
      {
        title: "Redeemed",
        value: stats?.redeemed_count ?? batch?.redeemed_count ?? 0,
      },
      {
        title: "Available",
        value:
          stats?.available_count ??
          batch?.available_codes ??
          Math.max(
            Number(batch?.quantity ?? 0) - Number(batch?.redeemed_count ?? 0),
            0,
          ),
      },
      {
        title: "View Limit",
        value: batch?.view_limit_per_code ?? 0,
      },
      {
        title: "Sold Limit",
        value: batch?.sold_limit ?? "Not set",
      },
    ];
  }, [
    batch?.available_codes,
    batch?.quantity,
    batch?.redeemed_count,
    batch?.sold_limit,
    batch?.view_limit_per_code,
    stats?.available_count,
    stats?.redeemed_count,
    stats?.total_codes,
  ]);

  if (batchQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!batch || batchQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Batch not found</AlertTitle>
        <AlertDescription>
          {batchQuery.error instanceof Error
            ? batchQuery.error.message
            : "The requested batch could not be loaded."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.batch_code ?? `Batch ${batch.id}`}
        description={`${batch.video_title ?? "Unknown video"} • ${batch.course_title ?? "Unknown course"}`}
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          {
            label: "Video Code Batches",
            href: `/centers/${centerId}/video-code-batches`,
          },
          { label: batch.batch_code ?? `Batch ${batch.id}` },
        ]}
        actions={
          <>
            <Link href={`/centers/${centerId}/video-code-batches`}>
              <Button variant="outline">Back to Batches</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => void handleExport("csv")}
              disabled={downloadKey === "csv"}
            >
              {downloadKey === "csv" ? "Exporting CSV..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleExport("pdf")}
              disabled={downloadKey === "pdf"}
            >
              {downloadKey === "pdf" ? "Exporting PDF..." : "Export PDF"}
            </Button>
            <Button variant="outline" onClick={() => setIsWhatsappOpen(true)}>
              Send CSV to WhatsApp
            </Button>
            {canExpand ? (
              <Button variant="outline" onClick={() => setIsExpandOpen(true)}>
                Expand Batch
              </Button>
            ) : null}
            {canClose ? (
              <Button onClick={() => setIsCloseOpen(true)}>
                {normalizeStatus(batch.status) === "closed"
                  ? "Update Sold Limit"
                  : "Close Batch"}
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-5">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Generated by {batch.generated_by?.name ?? "Unknown admin"} on{" "}
            {batch.generated_at
              ? formatDateTime(String(batch.generated_at))
              : "—"}
          </span>
          {batch.closed_at ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Closed on {formatDateTime(String(batch.closed_at))}
            </span>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statsCards.map((card) => (
          <StatsCard key={card.title} title={card.title} value={card.value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between gap-4">
              <span>Course</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {batch.course_title ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Video</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {batch.video_title ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Batch Code</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {batch.batch_code ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>First Redemption</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.first_redemption_at
                  ? formatDateTime(String(stats.first_redemption_at))
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Last Redemption</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.last_redemption_at
                  ? formatDateTime(String(stats.last_redemption_at))
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              {exportsHistory.length === 0 ? (
                <EmptyState
                  title="No exports yet"
                  description="CSV and PDF exports will appear here after the first export."
                  className="border-0 bg-transparent p-0"
                />
              ) : (
                <div className="space-y-3">
                  {exportsHistory.map((record, index) => (
                    <div
                      key={
                        record.id ??
                        `${record.type ?? record.format ?? "export"}-${record.exported_at ?? index}`
                      }
                      className="rounded-lg border border-gray-200 px-3 py-3 text-sm dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {resolveExportTitle(record)}
                        </div>
                        {record.status ? (
                          <Badge
                            variant={
                              resolveExportStatusMeta(record.status).variant
                            }
                          >
                            {resolveExportStatusMeta(record.status).label}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {record.exported_at
                          ? formatDateTime(String(record.exported_at))
                          : "Unknown time"}
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {resolveDeliveryChannelLabel(record)
                          ? `${resolveDeliveryChannelLabel(record)}`
                          : "Export"}
                        {record.destination_masked
                          ? ` • ${record.destination_masked}`
                          : ""}
                        {record.file_name ? ` • ${record.file_name}` : ""}
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {record.code_range
                          ? `Codes ${record.code_range}`
                          : "Full batch export"}
                        {record.count != null ? ` • ${record.count} codes` : ""}
                        {record.exported_by?.name
                          ? ` • ${record.exported_by.name}`
                          : ""}
                      </div>
                      {record.error ? (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          {record.error}
                        </div>
                      ) : null}
                      {record.completed_at ? (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Completed{" "}
                          {formatDateTime(String(record.completed_at))}
                        </div>
                      ) : null}
                      {record.status &&
                      normalizeStatus(record.status) === "processing" ? (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Waiting for WhatsApp delivery confirmation...
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Redemption Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentRedemptions.length === 0 ? (
                <EmptyState
                  title="No recent redemptions"
                  description="Recent redemption activity from the statistics endpoint will appear here."
                  className="border-0 bg-transparent p-0"
                />
              ) : (
                <div className="space-y-3">
                  {recentRedemptions.map((redemption) => (
                    <div
                      key={String(redemption.id)}
                      className="rounded-lg border border-gray-200 px-3 py-3 text-sm dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {redemption.user?.name ?? "Unknown student"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {redemption.redeemed_at
                            ? formatDateTime(String(redemption.redeemed_at))
                            : "—"}
                        </div>
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {redemption.code ?? "—"}
                        {redemption.user?.phone
                          ? ` • ${redemption.user.phone}`
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Redemptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Input
              value={search}
              onChange={(event) => {
                const next = event.target.value;
                setSearch(next);
                setRedemptionsPage(1);
                setQuery(next.trim());
              }}
              placeholder="Search redemptions..."
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Redeemed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptionsQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 5 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : redemptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10">
                      <EmptyState
                        title="No redemptions found"
                        description="Redemptions will appear here once students start redeeming codes from this batch."
                        className="border-0 bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  redemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {redemption.code ?? "—"}
                      </TableCell>
                      <TableCell>{redemption.sequence_number ?? "—"}</TableCell>
                      <TableCell>
                        {redemption.user?.name ?? "Unknown student"}
                      </TableCell>
                      <TableCell>{redemption.user?.phone ?? "—"}</TableCell>
                      <TableCell>
                        {redemption.redeemed_at
                          ? formatDateTime(String(redemption.redeemed_at))
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {redemptions.length > 0 ? (
            <PaginationControls
              page={redemptionsPage}
              lastPage={redemptionsLastPage}
              isFetching={redemptionsQuery.isFetching}
              onPageChange={setRedemptionsPage}
              perPage={redemptionsPerPage}
              onPerPageChange={(value) => {
                setRedemptionsPerPage(value);
                setRedemptionsPage(1);
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      <ExpandVideoCodeBatchDialog
        open={isExpandOpen}
        onOpenChange={setIsExpandOpen}
        centerId={centerId}
        batch={batch}
        onCompleted={() =>
          Promise.all([
            batchQuery.refetch(),
            statsQuery.refetch(),
            redemptionsQuery.refetch(),
          ]).then(() => undefined)
        }
      />

      <CloseVideoCodeBatchDialog
        open={isCloseOpen}
        onOpenChange={setIsCloseOpen}
        centerId={centerId}
        batch={batch}
        onCompleted={() =>
          Promise.all([
            batchQuery.refetch(),
            statsQuery.refetch(),
            redemptionsQuery.refetch(),
          ]).then(() => undefined)
        }
      />

      <SendVideoCodeBatchWhatsappCsvDialog
        open={isWhatsappOpen}
        onOpenChange={setIsWhatsappOpen}
        centerId={centerId}
        batch={batch}
        onSent={(record) => {
          showToast(
            normalizeStatus(record.status) === "sent"
              ? "WhatsApp CSV sent successfully."
              : "WhatsApp CSV send started.",
            "success",
          );
        }}
        onCompleted={() =>
          Promise.all([batchQuery.refetch(), statsQuery.refetch()]).then(
            () => undefined,
          )
        }
      />
    </div>
  );
}
