"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listCourses } from "@/features/courses/services/courses.service";
import { useBulkEnrollStudents } from "@/features/students/hooks/use-students";
import type { Student } from "@/features/students/types/student";

type BulkEnrollStudentsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  students: Student[];
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

export function BulkEnrollStudentsDialog({
  open,
  onOpenChange,
  students,
  centerId,
  onSuccess,
}: BulkEnrollStudentsDialogProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    counts?: {
      total?: number;
      approved?: number;
      skipped?: number;
      failed?: number;
    };
    skipped?: Array<string | number>;
    failed?: Array<{ user_id?: string | number; reason?: string }>;
  } | null>(null);

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["bulk-enroll-courses", centerId ?? "all"],
    queryFn: () =>
      listCourses({
        page: 1,
        per_page: 100,
        center_id: centerId ?? undefined,
      }),
    enabled: open,
  });

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    return (
      coursesData?.items.map((course) => ({
        value: String(course.id),
        label: course.title || `Course ${course.id}`,
      })) ?? []
    );
  }, [coursesData]);

  const enrollMutation = useBulkEnrollStudents();
  const isPending = enrollMutation.isPending;

  const handleEnroll = () => {
    if (!centerId) {
      setErrorMessage("Select a center before enrolling students.");
      return;
    }
    if (!selectedCourse) {
      setErrorMessage("Select a course to enroll students.");
      return;
    }
    if (students.length === 0) {
      setErrorMessage("No students selected.");
      return;
    }

    setErrorMessage(null);
    enrollMutation.mutate(
      {
        center_id: centerId,
        course_id: selectedCourse,
        user_ids: students.map((student) => student.id),
      },
      {
        onSuccess: (data) => {
          setResult({
            counts: data?.counts,
            skipped: data?.skipped,
            failed: data?.failed,
          });
          onSuccess?.("Bulk enrollment processed.");
        },
        onError: () => {
          setErrorMessage("Unable to enroll students. Please try again.");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedCourse(null);
          setErrorMessage(null);
          setResult(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Bulk Enroll Students</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enroll {students.length} selected students into a course.
          </p>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Unable to enroll</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {result.counts.total ?? students.length}</span>
              <span>Approved: {result.counts.approved ?? 0}</span>
              <span>Skipped: {result.counts.skipped ?? 0}</span>
              <span>Failed: {result.counts.failed ?? 0}</span>
            </div>
            {result.failed && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs">
                {result.failed.map((item, index) => (
                  <p key={`${item.user_id}-${index}`}>
                    #{item.user_id ?? "?"}: {item.reason ?? "Failed"}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a course to enroll students in.
          </p>
          <SearchableSelect
            value={selectedCourse}
            onValueChange={setSelectedCourse}
            options={courseOptions}
            placeholder="Select a course"
            searchPlaceholder="Search courses..."
            emptyMessage="No courses found"
            isLoading={isCoursesLoading}
            showSearch={courseOptions.length > 8}
            triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleEnroll} disabled={isPending}>
            {isPending ? "Enrolling..." : "Enroll Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
