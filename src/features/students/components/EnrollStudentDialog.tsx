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
import type { Student } from "@/features/students/types/student";
import { listCourses } from "@/features/courses/services/courses.service";
import { useModal } from "@/components/ui/modal-store";

type EnrollStudentDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  student?: Student | null;
  centerId?: string | number | null;
};

export function EnrollStudentDialog({
  open,
  onOpenChange,
  student,
  centerId,
}: EnrollStudentDialogProps) {
  const { showToast } = useModal();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["enroll-student-courses", centerId ?? "all"],
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

  const handleEnroll = () => {
    if (!selectedCourse) {
      showToast("Select a course first.", "error");
      return;
    }

    showToast("Enrollment not implemented yet.", "error");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a course to enroll {student?.name ?? "this student"}.
          </p>
          <SearchableSelect
            value={selectedCourse}
            onValueChange={setSelectedCourse}
            options={courseOptions}
            placeholder="Select a course"
            searchPlaceholder="Search courses..."
            emptyMessage="No courses found"
            isLoading={isLoading}
            triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            showSearch={courseOptions.length > 8}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll}>Enroll</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
