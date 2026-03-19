"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkUpdateStudentStatus } from "@/features/students/hooks/use-students";
import type { Student } from "@/features/students/types/student";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

function getErrorMessage(error: unknown, t: TranslateFunction) {
  return getAdminApiErrorMessage(
    error,
    t("pages.students.dialogs.bulkStatus.errors.updateFailed"),
  );
}

type BulkUpdateStudentStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  students: Student[];
  onSuccess?: (_message: string) => void;
  scopeCenterId?: string | number | null;
};

export function BulkUpdateStudentStatusDialog({
  open,
  onOpenChange,
  students,
  onSuccess,
  scopeCenterId,
}: BulkUpdateStudentStatusDialogProps) {
  const { t } = useTranslation();

  const [status, setStatus] = useState<string>("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    counts?: {
      total?: number;
      updated?: number;
      skipped?: number;
      failed?: number;
    };
    skipped?: Array<string | number>;
    failed?: Array<{ student_id?: string | number; reason?: string }>;
  } | null>(null);

  const mutation = useBulkUpdateStudentStatus({
    centerId: scopeCenterId ?? null,
  });
  const isPending = mutation.isPending;

  const handleUpdate = () => {
    if (students.length === 0) {
      setErrorMessage(t("pages.students.dialogs.bulkStatus.errors.noStudents"));
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        status,
        student_ids: students.map((student) => student.id),
      },
      {
        onSuccess: (data) => {
          if (!isAdminRequestSuccessful(data)) {
            setErrorMessage(
              getAdminResponseMessage(
                data,
                t("pages.students.dialogs.bulkStatus.errors.processFailed"),
              ),
            );
            return;
          }
          setResult({
            counts: data?.counts,
            skipped: data?.skipped,
            failed: data?.failed,
          });
          onSuccess?.(
            getAdminResponseMessage(
              data,
              t("pages.students.dialogs.bulkStatus.messages.processed"),
            ),
          );
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, t));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setErrorMessage(null);
          setResult(null);
          setStatus("1");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {t("pages.students.dialogs.bulkStatus.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.students.dialogs.bulkStatus.description", {
              count: students.length,
            })}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.students.dialogs.bulkStatus.errors.errorTitle")}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>
                {t("pages.students.dialogs.bulkStatus.summary.total")}
                {result.counts.total ?? students.length}
              </span>
              <span>
                {t("pages.students.dialogs.bulkStatus.summary.updated")}
                {result.counts.updated ?? 0}
              </span>
              <span>
                {t("pages.students.dialogs.bulkStatus.summary.skipped")}
                {result.counts.skipped ?? 0}
              </span>
              <span>
                {t("pages.students.dialogs.bulkStatus.summary.failed")}
                {result.counts.failed ?? 0}
              </span>
            </div>
            {result.failed && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs">
                {result.failed.map((item, index) => (
                  <p key={`${item.student_id}-${index}`}>
                    {t(
                      "pages.students.dialogs.bulkStatus.summary.studentPrefix",
                    )}
                    {item.student_id ?? "?"}:{" "}
                    {item.reason ??
                      t(
                        "pages.students.dialogs.bulkStatus.summary.failedFallback",
                      )}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.students.dialogs.bulkStatus.help")}
          </p>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                {t("pages.students.table.status.active")}
              </SelectItem>
              <SelectItem value="0">
                {t("pages.students.table.status.inactive")}
              </SelectItem>
              <SelectItem value="2">
                {t("pages.students.table.status.banned")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.close")}
          </Button>
          <Button onClick={handleUpdate} disabled={isPending}>
            {isPending
              ? t("pages.students.dialogs.bulkStatus.actions.updating")
              : t("pages.students.dialogs.bulkStatus.actions.update")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
