"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/features/students/types/student";
import { resolveStudentStatus } from "@/features/students/utils/student-status";
import { formatDateTime } from "@/lib/format-date-time";

type StudentDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  student?: Student | null;
};

export function StudentDetailsDrawer({
  open,
  onOpenChange,
  student,
}: StudentDetailsDrawerProps) {
  const analytics = student?.analytics ?? null;
  const device = student?.device ?? null;
  const name = student?.name ?? "Student";
  const status = resolveStudentStatus(
    student?.status_key ?? student?.status,
    student?.status_label,
  );
  const centerLabel =
    student?.center?.name ??
    student?.center_id ??
    student?.center?.id ??
    "Najaah App";
  const email = student?.email ?? "—";
  const phone = student?.phone
    ? `${student?.country_code ?? ""} ${student.phone}`.trim()
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 left-auto right-0 top-0 flex h-dvh w-full max-w-[540px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-gray-200 p-6 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </DialogTitle>
            <DialogDescription>
              Student details, analytics, and device status.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Profile
                </h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {email}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {phone}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Center</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {centerLabel}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {status.label}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Activity
                </h3>
                <Badge variant="secondary">
                  {analytics?.last_activity_at
                    ? formatDateTime(analytics.last_activity_at)
                    : "No activity"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Total Enrollments</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.total_enrollments ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Active Enrollments</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.active_enrollments ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Total Sessions</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.total_sessions ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Full Play Sessions</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.full_play_sessions ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Viewed Videos</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.viewed_videos ?? 0}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Device
                </h3>
                {device ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">None</Badge>
                )}
              </div>
              {device ? (
                <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p>
                    <span className="font-medium text-gray-500">
                      Device ID:
                    </span>{" "}
                    <span className="break-all">{device.device_id ?? "—"}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Model:</span>{" "}
                    <span className="break-words">{device.model ?? "—"}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">OS:</span>{" "}
                    <span className="break-words">
                      {device.os_version ?? "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Approved:</span>{" "}
                    <span className="break-words">
                      {device.approved_at
                        ? formatDateTime(device.approved_at)
                        : "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      Last used:
                    </span>{" "}
                    <span className="break-words">
                      {device.last_used_at
                        ? formatDateTime(device.last_used_at)
                        : "—"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                  No device is registered for this student yet.
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
