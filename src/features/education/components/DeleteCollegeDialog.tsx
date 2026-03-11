"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteCollege } from "@/features/education/hooks/use-colleges";
import type { College } from "@/features/education/types/education";
import { getEducationName } from "@/features/education/types/education";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type DeleteCollegeDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  college?: College | null;
  onSuccess?: (_value: string) => void;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  COLLEGE_HAS_STUDENTS:
    "This college is currently assigned to students and cannot be deleted.",
};

function getErrorMessage(error: unknown) {
  const code = getAdminApiErrorCode(error);
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code];
  }

  return getAdminApiErrorMessage(error, "Unable to delete college.");
}

export function DeleteCollegeDialog({
  centerId,
  open,
  onOpenChange,
  college,
  onSuccess,
}: DeleteCollegeDialogProps) {
  const { t } = useTranslation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCollege();

  const handleDelete = () => {
    if (!college) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      {
        centerId,
        collegeId: college.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("College deleted successfully.");
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("auto.features.education.components.deletecollegedialog.s1")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("auto.features.education.components.deletecollegedialog.s1")}
          entityName={college ? getEducationName(college, "College") : null}
          entityFallback="this college"
          confirmButtonLabel="Delete College"
          pendingLabel="Deleting..."
          errorTitle="Could not delete college"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (college?.id ?? "college") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
