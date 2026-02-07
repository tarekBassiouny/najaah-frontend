export type StatusVariant =
  | "success"
  | "warning"
  | "secondary"
  | "error"
  | "default";

type StudentStatus = string | number | null | undefined;

const statusConfig: Record<string, { variant: StatusVariant; label: string }> =
  {
    active: { variant: "success", label: "Active" },
    enabled: { variant: "success", label: "Enabled" },
    approved: { variant: "success", label: "Approved" },
    pending: { variant: "warning", label: "Pending" },
    processing: { variant: "warning", label: "Processing" },
    inactive: { variant: "default", label: "Inactive" },
    disabled: { variant: "default", label: "Disabled" },
    failed: { variant: "error", label: "Failed" },
    rejected: { variant: "error", label: "Rejected" },
    error: { variant: "error", label: "Error" },
    banned: { variant: "error", label: "Banned" },
  };

export function resolveStudentStatus(
  status: StudentStatus,
  statusLabel?: string | null,
) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  const config = statusConfig[raw] ?? {
    variant: "default" as const,
    label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Unknown",
  };

  if (typeof statusLabel === "string" && statusLabel.trim()) {
    return { ...config, label: statusLabel.trim() };
  }

  return config;
}
