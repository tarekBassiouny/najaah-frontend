"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import { DeleteStudentDialog } from "@/features/students/components/DeleteStudentDialog";
import { StudentEnrollmentPromptDialog } from "@/features/students/components/StudentEnrollmentPromptDialog";
import { EnrollStudentDialog } from "@/features/students/components/EnrollStudentDialog";
import { BulkEnrollStudentsDialog } from "@/features/students/components/BulkEnrollStudentsDialog";
import { BulkUpdateStudentStatusDialog } from "@/features/students/components/BulkUpdateStudentStatusDialog";
import { StudentDetailsDrawer } from "@/features/students/components/StudentDetailsDrawer";
import type { Student } from "@/features/students/types/student";

export default function StudentsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [bulkEnrollStudents, setBulkEnrollStudents] = useState<Student[]>([]);
  const [bulkStatusStudents, setBulkStatusStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage students across centers, with optional center assignment"
        actions={
          <>
            <Button onClick={openCreateDialog}>Add Student</Button>
          </>
        }
      />

      {feedback && (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      <StudentsTable
        onEdit={(student) => {
          setFeedback(null);
          setEditingStudent(student);
          setIsFormOpen(true);
        }}
        onDelete={(student) => {
          setFeedback(null);
          setDeletingStudent(student);
        }}
        onViewDetails={(student) => setViewingStudent(student)}
        onBulkEnrollCourse={(students) => setBulkEnrollStudents(students)}
        onBulkChangeStatus={(students) => setBulkStatusStudents(students)}
      />

      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingStudent(null);
        }}
        centerId={centerId}
        student={editingStudent}
        onSuccess={(message) => setFeedback(message)}
        onCreated={(student) => {
          setCreatedStudent(student);
        }}
      />

      <DeleteStudentDialog
        open={Boolean(deletingStudent)}
        onOpenChange={(open) => {
          if (!open) setDeletingStudent(null);
        }}
        student={deletingStudent}
        onSuccess={(message) => setFeedback(message)}
      />

      <StudentEnrollmentPromptDialog
        open={Boolean(createdStudent)}
        onOpenChange={(open) => {
          if (!open) setCreatedStudent(null);
        }}
        student={createdStudent}
        onEnroll={() => {
          if (createdStudent) {
            setEnrollStudent(createdStudent);
          }
          setCreatedStudent(null);
        }}
        onSkip={() => setCreatedStudent(null)}
      />

      <EnrollStudentDialog
        open={Boolean(enrollStudent)}
        onOpenChange={(open) => {
          if (!open) setEnrollStudent(null);
        }}
        student={enrollStudent}
        centerId={centerId ?? null}
      />

      <StudentDetailsDrawer
        open={Boolean(viewingStudent)}
        onOpenChange={(open) => {
          if (!open) setViewingStudent(null);
        }}
        student={viewingStudent}
      />

      <BulkEnrollStudentsDialog
        open={bulkEnrollStudents.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkEnrollStudents([]);
        }}
        students={bulkEnrollStudents}
        centerId={centerId ?? null}
        onSuccess={(message) => setFeedback(message)}
      />

      <BulkUpdateStudentStatusDialog
        open={bulkStatusStudents.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusStudents([]);
        }}
        students={bulkStatusStudents}
        onSuccess={(message) => setFeedback(message)}
      />
    </div>
  );
}
