"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StudentsTable } from "@/features/students/components/StudentsTable";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import { DeleteStudentDialog } from "@/features/students/components/DeleteStudentDialog";
import { StudentEnrollmentPromptDialog } from "@/features/students/components/StudentEnrollmentPromptDialog";
import { EnrollStudentDialog } from "@/features/students/components/EnrollStudentDialog";
import { BulkEnrollStudentsDialog } from "@/features/students/components/BulkEnrollStudentsDialog";
import { BulkUpdateStudentStatusDialog } from "@/features/students/components/BulkUpdateStudentStatusDialog";
import { StudentDetailsDrawer } from "@/features/students/components/StudentDetailsDrawer";
import type { Student } from "@/features/students/types/student";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterStudentsPage({ params }: PageProps) {
  const { centerId } = use(params);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [bulkEnrollStudents, setBulkEnrollStudents] = useState<Student[]>([]);
  const [bulkStatusStudents, setBulkStatusStudents] = useState<Student[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage students for this center, with optional center assignment"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Students" },
        ]}
        actions={
          <>
            <Button
              onClick={() => {
                setEditingStudent(null);
                setIsFormOpen(true);
              }}
            >
              Add Student
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          </>
        }
      />

      <StudentsTable
        centerId={centerId}
        showCenterFilter={false}
        buildProfileHref={(student) =>
          `/centers/${centerId}/students/${student.id}?from=center`
        }
        onEdit={(student) => {
          setEditingStudent(student);
          setIsFormOpen(true);
        }}
        onDelete={(student) => {
          setDeletingStudent(student);
        }}
        onViewDetails={(student) => setViewingStudent(student)}
        onEnrollCourse={(student) => {
          setEnrollStudent(student);
        }}
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
        scopeCenterId={centerId}
        student={editingStudent}
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
        scopeCenterId={centerId}
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
        centerId={centerId}
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
        centerId={centerId}
      />

      <BulkUpdateStudentStatusDialog
        open={bulkStatusStudents.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusStudents([]);
        }}
        students={bulkStatusStudents}
        scopeCenterId={centerId}
      />
    </div>
  );
}
