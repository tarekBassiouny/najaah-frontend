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
import { getEducationName } from "@/features/education/types/education";
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();
  const emptyValue = t("pages.students.fallbacks.noValue");

  const analytics = student?.analytics ?? null;
  const device = student?.device ?? null;
  const name = student?.name ?? t("pages.students.fallbacks.student");
  const status = resolveStudentStatus(
    student?.status_key ?? student?.status,
    student?.status_label,
    t,
  );
  const centerLabel =
    student?.center?.name ??
    student?.center_id ??
    student?.center?.id ??
    t("pages.students.table.fallbackCenter");
  const email = student?.email ?? emptyValue;
  const phone = student?.phone
    ? `${student?.country_code ?? ""} ${student.phone}`.trim()
    : emptyValue;
  const grade = student?.grade
    ? getEducationName(student.grade, t("pages.students.table.filters.grade"))
    : emptyValue;
  const school = student?.school
    ? getEducationName(student.school, t("pages.students.table.filters.school"))
    : emptyValue;
  const college = student?.college
    ? getEducationName(
        student.college,
        t("pages.students.table.filters.college"),
      )
    : emptyValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 inset-y-0 left-auto right-0 flex h-dvh max-h-none w-full max-w-[540px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:max-h-none sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-gray-200 p-6 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </DialogTitle>
            <DialogDescription>
              {t("pages.students.dialogs.details.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.students.dialogs.details.sections.profile")}
                </h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.email")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {email}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.phone")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {phone}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.center")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {centerLabel}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.status")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {status.label}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.students.dialogs.details.sections.activity")}
                </h3>
                <Badge variant="secondary">
                  {analytics?.last_activity_at
                    ? formatDateTime(analytics.last_activity_at)
                    : t("pages.students.dialogs.details.states.noActivity")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "pages.students.dialogs.details.fields.totalEnrollments",
                    )}
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.total_enrollments ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "pages.students.dialogs.details.fields.activeEnrollments",
                    )}
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.active_enrollments ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.totalSessions")}
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.total_sessions ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "pages.students.dialogs.details.fields.fullPlaySessions",
                    )}
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.full_play_sessions ?? 0}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.viewedVideos")}
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {analytics?.viewed_videos ?? 0}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.students.dialogs.details.sections.education")}
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.grade")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {grade}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.school")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {school}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t("pages.students.dialogs.details.fields.college")}
                  </p>
                  <p className="break-words text-base font-semibold text-gray-900 dark:text-white">
                    {college}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.students.dialogs.details.sections.device")}
                </h3>
                {device ? (
                  <Badge variant="success">
                    {t("pages.students.dialogs.details.states.active")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {t("pages.students.dialogs.details.states.none")}
                  </Badge>
                )}
              </div>
              {device ? (
                <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.deviceName")}
                    </span>{" "}
                    <span className="break-words">
                      {device.device_name ?? emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.deviceType")}
                    </span>{" "}
                    <span className="break-words">
                      {device.device_type ?? emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.deviceId")}
                    </span>{" "}
                    <span className="break-all">
                      {device.device_id ?? emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.model")}
                    </span>{" "}
                    <span className="break-words">
                      {device.model ?? emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.osVersion")}
                    </span>{" "}
                    <span className="break-words">
                      {device.os_version ?? emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.deviceStatus")}
                    </span>{" "}
                    <span className="break-words">
                      {device.status_label ?? device.status_key ?? emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.approvedAt")}
                    </span>{" "}
                    <span className="break-words">
                      {device.approved_at
                        ? formatDateTime(device.approved_at)
                        : emptyValue}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">
                      {t("pages.students.dialogs.details.fields.lastUsedAt")}
                    </span>{" "}
                    <span className="break-words">
                      {device.last_used_at
                        ? formatDateTime(device.last_used_at)
                        : emptyValue}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                  {t("pages.students.dialogs.details.states.noDevice")}
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
