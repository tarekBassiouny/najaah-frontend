"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Student } from "@/features/students/types/student";

type StudentEnrollmentPromptDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  student?: Student | null;
  onEnroll: () => void;
  onSkip: () => void;
};

export function StudentEnrollmentPromptDialog({
  open,
  onOpenChange,
  student,
  onEnroll,
  onSkip,
}: StudentEnrollmentPromptDialogProps) {
  const name = student?.name ? String(student.name) : "this student";
  const phone = student?.phone ? String(student.phone) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
              {name
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="space-y-1">
              <DialogTitle>Student created</DialogTitle>
              <DialogDescription>
                We’ve sent a notification to {name}. You can enroll them in a
                course now or do it later.
              </DialogDescription>
              {phone ? (
                <p className="text-xs text-gray-400">Phone · {phone}</p>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
          Tip: Enrolling now helps the student start immediately, but you can
          always enroll them later from the Students list.
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={onSkip}>
            Not now
          </Button>
          <Button onClick={onEnroll}>Enroll in Course</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
