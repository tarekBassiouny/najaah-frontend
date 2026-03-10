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
import { BulkGenerateVideoAccessCodesDialog } from "@/features/students/components/BulkGenerateVideoAccessCodesDialog";
import { BulkEnrollAndGenerateDialog } from "@/features/students/components/BulkEnrollAndGenerateDialog";
import { BulkUpdateStudentStatusDialog } from "@/features/students/components/BulkUpdateStudentStatusDialog";
import { StudentDetailsDrawer } from "@/features/students/components/StudentDetailsDrawer";
import { GenerateVideoAccessCodeDialog } from "@/features/video-access/components/GenerateVideoAccessCodeDialog";
import { can } from "@/lib/capabilities";
import { useTranslation } from "@/features/localization";
import type { Student } from "@/features/students/types/student";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterStudentsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [enrollStudent, setEnrollStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [generateStudent, setGenerateStudent] = useState<Student | null>(null);
  const [bulkEnrollStudents, setBulkEnrollStudents] = useState<Student[]>([]);
  const [bulkStatusStudents, setBulkStatusStudents] = useState<Student[]>([]);
  const [bulkGenerateStudents, setBulkGenerateStudents] = useState<Student[]>(
    [],
  );
  const [bulkEnrollAndGenerateStudents, setBulkEnrollAndGenerateStudents] =
    useState<Student[]>([]);
  const canManageVideoAccess = can("manage_video_access");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerStudents.title")}
        description={t("pages.centerStudents.description")}
        actions={
          <>
            <Button
              onClick={() => {
                setEditingStudent(null);
                setIsFormOpen(true);
              }}
            >
              {t("pages.studentsPage.addStudent")}
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerStudents.backToCenter")}
              </Button>
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
        onGenerateAccessCode={
          canManageVideoAccess
            ? (student) => {
                setGenerateStudent(student);
              }
            : undefined
        }
        onBulkEnrollCourse={(students) => setBulkEnrollStudents(students)}
        onBulkChangeStatus={(students) => setBulkStatusStudents(students)}
        onBulkGenerateAccessCodes={(students) =>
          setBulkGenerateStudents(students)
        }
        onBulkEnrollAndGenerate={(students) =>
          setBulkEnrollAndGenerateStudents(students)
        }
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

      <GenerateVideoAccessCodeDialog
        open={Boolean(generateStudent)}
        onOpenChange={(open) => {
          if (!open) setGenerateStudent(null);
        }}
        centerId={centerId}
        studentCenter={generateStudent?.center ?? null}
        studentPreset={
          generateStudent
            ? {
                id: generateStudent.id,
                label:
                  generateStudent.name ??
                  generateStudent.email ??
                  `Student ${generateStudent.id}`,
              }
            : null
        }
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

      <BulkGenerateVideoAccessCodesDialog
        open={bulkGenerateStudents.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkGenerateStudents([]);
        }}
        students={bulkGenerateStudents}
        centerId={centerId}
      />

      <BulkEnrollAndGenerateDialog
        open={bulkEnrollAndGenerateStudents.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkEnrollAndGenerateStudents([]);
        }}
        students={bulkEnrollAndGenerateStudents}
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
