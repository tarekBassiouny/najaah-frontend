"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "@/features/localization";
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

function resolveStatusMeta(
  value: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const normalized = normalizeStatus(value);
  if (normalized === "open") {
    return {
      label: t(
        "auto.features.video_code_batches.components.videocodebatchestable.statusOpen",
      ),
      variant: "success" as const,
    };
  }

  if (normalized === "closed") {
    return {
      label: t(
        "auto.features.video_code_batches.components.videocodebatchestable.statusClosed",
      ),
      variant: "default" as const,
    };
  }

  return {
    label:
      typeof value === "string" && value.trim().length > 0
        ? value
        : t(
            "auto.features.video_code_batches.components.videocodebatchestable.unknownStatus",
          ),
    variant: "secondary" as const,
  };
}

function resolveExportStatusMeta(
  status: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const normalized = normalizeStatus(status);

  if (normalized === "processing") {
    return {
      label: t(
        "auto.features.video_code_batches.components.videocodebatchdetailspage.exportStatus.processing",
      ),
      variant: "warning" as const,
    };
  }

  if (normalized === "sent" || normalized === "completed") {
    return {
      label:
        normalized === "sent"
          ? t(
              "auto.features.video_code_batches.components.videocodebatchdetailspage.exportStatus.sent",
            )
          : t(
              "auto.features.video_code_batches.components.videocodebatchdetailspage.exportStatus.completed",
            ),
      variant: "success" as const,
    };
  }

  if (normalized === "failed") {
    return {
      label: t(
        "auto.features.video_code_batches.components.videocodebatchdetailspage.exportStatus.failed",
      ),
      variant: "error" as const,
    };
  }

  return {
    label:
      typeof status === "string" && status.trim().length > 0
        ? status
        : t(
            "auto.features.video_code_batches.components.videocodebatchestable.unknownStatus",
          ),
    variant: "secondary" as const,
  };
}

function resolveExportTitle(
  record: VideoCodeBatchExportRecord,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  if (record.type === "whatsapp_csv") {
    return t(
      "auto.features.video_code_batches.components.videocodebatchdetailspage.exportTitles.whatsappCsv",
    );
  }
  if (record.format === "pdf") {
    return t(
      "auto.features.video_code_batches.components.videocodebatchdetailspage.exportTitles.pdfDownload",
    );
  }
  if (record.format === "csv") {
    return t(
      "auto.features.video_code_batches.components.videocodebatchdetailspage.exportTitles.csvDownload",
    );
  }
  return t(
    "auto.features.video_code_batches.components.videocodebatchdetailspage.exportTitles.export",
  );
}

function resolveDeliveryChannelLabel(
  record: VideoCodeBatchExportRecord,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  if (record.delivery_channel === "whatsapp") {
    return t(
      "auto.features.video_code_batches.components.videocodebatchdetailspage.deliveryChannel.whatsapp",
    );
  }
  if (record.delivery_channel === "download") {
    return t(
      "auto.features.video_code_batches.components.videocodebatchdetailspage.deliveryChannel.download",
    );
  }
  return null;
}

export function VideoCodeBatchDetailsPage({
  centerId,
  batchId,
}: VideoCodeBatchDetailsPageProps) {
  const { t } = useTranslation();
  const detailsT = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(
        `auto.features.video_code_batches.components.videocodebatchdetailspage.${key}`,
        params,
      ),
    [t],
  );
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
  const status = resolveStatusMeta(batch?.status_label ?? batch?.status, t);
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
      showToast(
        t(
          format === "csv"
            ? "auto.features.video_code_batches.components.videocodebatchestable.exportCsvSuccess"
            : "auto.features.video_code_batches.components.videocodebatchestable.exportPdfSuccess",
        ),
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : t(
              format === "csv"
                ? "auto.features.video_code_batches.components.videocodebatchestable.exportCsvFailed"
                : "auto.features.video_code_batches.components.videocodebatchestable.exportPdfFailed",
            ),
        "error",
      );
    } finally {
      setDownloadKey(null);
    }
  };

  const statsCards = useMemo(() => {
    return [
      {
        title: detailsT("stats.totalCodes"),
        value: stats?.total_codes ?? batch?.quantity ?? 0,
      },
      {
        title: detailsT("stats.redeemed"),
        value: stats?.redeemed_count ?? batch?.redeemed_count ?? 0,
      },
      {
        title: detailsT("stats.available"),
        value:
          stats?.available_count ??
          batch?.available_codes ??
          Math.max(
            Number(batch?.quantity ?? 0) - Number(batch?.redeemed_count ?? 0),
            0,
          ),
      },
      {
        title: detailsT("stats.viewLimit"),
        value: batch?.view_limit_per_code ?? 0,
      },
      {
        title: detailsT("stats.soldLimit"),
        value: batch?.sold_limit ?? detailsT("notSet"),
      },
    ];
  }, [
    batch?.available_codes,
    batch?.quantity,
    batch?.redeemed_count,
    batch?.sold_limit,
    batch?.view_limit_per_code,
    detailsT,
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
        <AlertTitle>
          {t(
            "auto.features.video_code_batches.components.videocodebatchdetailspage.batchNotFound",
          )}
        </AlertTitle>
        <AlertDescription>
          {batchQuery.error instanceof Error
            ? batchQuery.error.message
            : detailsT("loadFailed")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          batch.batch_code ??
          t(
            "auto.features.video_code_batches.components.videocodebatchestable.batchWithId",
            { id: batch.id },
          )
        }
        description={`${batch.video_title ?? detailsT("unknownVideo")} • ${batch.course_title ?? detailsT("unknownCourse")}`}
        breadcrumbs={[
          { label: t("common.labels.centers"), href: "/centers" },
          {
            label: t("common.centerWithId", { id: centerId }),
            href: `/centers/${centerId}`,
          },
          {
            label: t(
              "auto.features.video_code_batches.pages.videocodebatches.title",
            ),
            href: `/centers/${centerId}/code-batches`,
          },
          {
            label:
              batch.batch_code ??
              t(
                "auto.features.video_code_batches.components.videocodebatchestable.batchWithId",
                { id: batch.id },
              ),
          },
        ]}
        actions={
          <>
            <Link href={`/centers/${centerId}/code-batches`}>
              <Button variant="outline">
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.backToBatches",
                )}
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => void handleExport("csv")}
              disabled={downloadKey === "csv"}
            >
              {downloadKey === "csv"
                ? t(
                    "auto.features.video_code_batches.components.videocodebatchestable.exportingCsv",
                  )
                : t(
                    "auto.features.video_code_batches.components.videocodebatchestable.exportCsv",
                  )}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleExport("pdf")}
              disabled={downloadKey === "pdf"}
            >
              {downloadKey === "pdf"
                ? t(
                    "auto.features.video_code_batches.components.videocodebatchestable.exportingPdf",
                  )
                : t(
                    "auto.features.video_code_batches.components.videocodebatchestable.exportPdf",
                  )}
            </Button>
            <Button variant="outline" onClick={() => setIsWhatsappOpen(true)}>
              {t(
                "auto.features.video_code_batches.components.videocodebatchdetailspage.sendCsvWhatsapp",
              )}
            </Button>
            {canExpand ? (
              <Button variant="outline" onClick={() => setIsExpandOpen(true)}>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.expandBatch",
                )}
              </Button>
            ) : null}
            {canClose ? (
              <Button onClick={() => setIsCloseOpen(true)}>
                {normalizeStatus(batch.status) === "closed"
                  ? t(
                      "auto.features.video_code_batches.components.closevideocodebatchdialog.updateSoldLimit",
                    )
                  : t(
                      "auto.features.video_code_batches.components.closevideocodebatchdialog.closeBatch",
                    )}
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-5">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t(
              "auto.features.video_code_batches.components.videocodebatchdetailspage.generatedBy",
            )}{" "}
            {batch.generated_by?.name ?? detailsT("unknownAdmin")}{" "}
            {detailsT("generatedOn")}{" "}
            {batch.generated_at
              ? formatDateTime(String(batch.generated_at))
              : "—"}
          </span>
          {batch.closed_at ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                "auto.features.video_code_batches.components.videocodebatchdetailspage.closedOn",
              )}{" "}
              {formatDateTime(String(batch.closed_at))}
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
            <CardTitle>
              {t(
                "auto.features.video_code_batches.components.videocodebatchdetailspage.batchInformation",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between gap-4">
              <span>{detailsT("course")}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {batch.course_title ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>{detailsT("video")}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {batch.video_title ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.batchCode",
                )}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {batch.batch_code ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.firstRedemption",
                )}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.first_redemption_at
                  ? formatDateTime(String(stats.first_redemption_at))
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.lastRedemption",
                )}
              </span>
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
              <CardTitle>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.exportHistory",
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exportsHistory.length === 0 ? (
                <EmptyState
                  title={t(
                    "auto.features.video_code_batches.components.videocodebatchdetailspage.noExportsTitle",
                  )}
                  description={t(
                    "auto.features.video_code_batches.components.videocodebatchdetailspage.noExportsDescription",
                  )}
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
                          {resolveExportTitle(record, t)}
                        </div>
                        {record.status ? (
                          <Badge
                            variant={
                              resolveExportStatusMeta(record.status, t).variant
                            }
                          >
                            {resolveExportStatusMeta(record.status, t).label}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {record.exported_at
                          ? formatDateTime(String(record.exported_at))
                          : detailsT("unknownTime")}
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {resolveDeliveryChannelLabel(record, t)
                          ? `${resolveDeliveryChannelLabel(record, t)}`
                          : detailsT("exportTitles.export")}
                        {record.destination_masked
                          ? ` • ${record.destination_masked}`
                          : ""}
                        {record.file_name ? ` • ${record.file_name}` : ""}
                      </div>
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        {record.code_range
                          ? detailsT("codesRange", { range: record.code_range })
                          : detailsT("fullBatchExport")}
                        {record.count != null
                          ? ` • ${detailsT("codesCount", { count: record.count })}`
                          : ""}
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
                          {detailsT("completed")}{" "}
                          {formatDateTime(String(record.completed_at))}
                        </div>
                      ) : null}
                      {record.status &&
                      normalizeStatus(record.status) === "processing" ? (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t(
                            "auto.features.video_code_batches.components.videocodebatchdetailspage.waitingWhatsappDelivery",
                          )}
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
              <CardTitle>
                {t(
                  "auto.features.video_code_batches.components.videocodebatchdetailspage.recentRedemptionActivity",
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRedemptions.length === 0 ? (
                <EmptyState
                  title={t(
                    "auto.features.video_code_batches.components.videocodebatchdetailspage.noRecentRedemptionsTitle",
                  )}
                  description={t(
                    "auto.features.video_code_batches.components.videocodebatchdetailspage.noRecentRedemptionsDescription",
                  )}
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
                          {redemption.user?.name ?? detailsT("unknownStudent")}
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
          <CardTitle>{detailsT("redemptionsTitle")}</CardTitle>
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
              placeholder={t(
                "auto.features.video_code_batches.components.videocodebatchdetailspage.searchRedemptionsPlaceholder",
              )}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{detailsT("columns.code")}</TableHead>
                  <TableHead>{detailsT("columns.sequence")}</TableHead>
                  <TableHead>{detailsT("columns.student")}</TableHead>
                  <TableHead>{detailsT("columns.phone")}</TableHead>
                  <TableHead>
                    {t(
                      "auto.features.video_code_batches.components.videocodebatchdetailspage.redeemedAt",
                    )}
                  </TableHead>
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
                        title={t(
                          "auto.features.video_code_batches.components.videocodebatchdetailspage.noRedemptionsTitle",
                        )}
                        description={t(
                          "auto.features.video_code_batches.components.videocodebatchdetailspage.noRedemptionsDescription",
                        )}
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
                        {redemption.user?.name ?? detailsT("unknownStudent")}
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
              ? detailsT("whatsappSentSuccess")
              : detailsT("whatsappSendStarted"),
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
