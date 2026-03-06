"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteSchool } from "@/features/education/hooks/use-schools";
import type { School } from "@/features/education/types/education";
import {
  getEducationName,
  getSchoolTypeLabel,
} from "@/features/education/types/education";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";

type DeleteSchoolDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  school?: School | null;
  onSuccess?: (_value: string) => void;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  SCHOOL_HAS_STUDENTS:
    "This school is currently assigned to students and cannot be deleted.",
};

function getErrorMessage(error: unknown) {
  const code = getAdminApiErrorCode(error);
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code];
  }

  return getAdminApiErrorMessage(error, "Unable to delete school.");
}

export function DeleteSchoolDialog({
  centerId,
  open,
  onOpenChange,
  school,
  onSuccess,
}: DeleteSchoolDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteSchool();

  const handleDelete = () => {
    if (!school) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      {
        centerId,
        schoolId: school.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("School deleted successfully.");
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  const schoolLabel = school
    ? `${getEducationName(school, "School")} (${getSchoolTypeLabel(
        school.type,
        school.type_label,
      )})`
    : null;

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
          <DialogTitle className="sr-only">Delete School</DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title="Delete School"
          entityName={schoolLabel}
          entityFallback="this school"
          confirmButtonLabel="Delete School"
          pendingLabel="Deleting..."
          errorTitle="Could not delete school"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (school?.id ?? "school") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
