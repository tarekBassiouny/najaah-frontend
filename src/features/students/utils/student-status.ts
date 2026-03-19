import type { TranslateFunction } from "@/features/localization";

export type StatusVariant =
  | "success"
  | "warning"
  | "secondary"
  | "error"
  | "default";

type StudentStatus = string | number | null | undefined;

export function resolveStudentStatus(
  status: StudentStatus,
  statusLabel?: string | null,
  t?: TranslateFunction,
) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  const statusConfig: Record<
    string,
    { variant: StatusVariant; label: string }
  > = {
    active: {
      variant: "success",
      label: t ? t("pages.students.table.status.active") : "Active",
    },
    enabled: {
      variant: "success",
      label: t ? t("pages.students.table.status.enabled") : "Enabled",
    },
    approved: {
      variant: "success",
      label: t ? t("pages.students.table.status.approved") : "Approved",
    },
    pending: {
      variant: "warning",
      label: t ? t("pages.students.table.status.pending") : "Pending",
    },
    processing: {
      variant: "warning",
      label: t ? t("pages.students.table.status.processing") : "Processing",
    },
    inactive: {
      variant: "default",
      label: t ? t("pages.students.table.status.inactive") : "Inactive",
    },
    disabled: {
      variant: "default",
      label: t ? t("pages.students.table.status.disabled") : "Disabled",
    },
    failed: {
      variant: "error",
      label: t ? t("pages.students.table.status.failed") : "Failed",
    },
    rejected: {
      variant: "error",
      label: t ? t("pages.students.table.status.rejected") : "Rejected",
    },
    error: {
      variant: "error",
      label: t ? t("pages.students.table.status.error") : "Error",
    },
    banned: {
      variant: "error",
      label: t ? t("pages.students.table.status.banned") : "Banned",
    },
  };
  const config = statusConfig[raw] ?? {
    variant: "default" as const,
    label: raw
      ? raw.charAt(0).toUpperCase() + raw.slice(1)
      : t
        ? t("pages.students.table.status.unknown")
        : "Unknown",
  };

  if (typeof statusLabel === "string" && statusLabel.trim()) {
    return { ...config, label: statusLabel.trim() };
  }

  return config;
}
