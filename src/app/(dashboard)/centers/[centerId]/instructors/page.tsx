"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/features/localization";
import { InstructorsTable } from "@/features/instructors/components/InstructorsTable";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import { DeleteInstructorDialog } from "@/features/instructors/components/DeleteInstructorDialog";
import { InstructorDetailsDrawer } from "@/features/instructors/components/InstructorDetailsDrawer";
import type { Instructor } from "@/features/instructors/types/instructor";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterInstructorsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null,
  );
  const [viewingInstructor, setViewingInstructor] = useState<Instructor | null>(
    null,
  );
  const [deletingInstructor, setDeletingInstructor] =
    useState<Instructor | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.instructors.title")}
        description={t("pages.centerInstructors.description")}
        actions={
          <>
            <Button
              onClick={() => {
                setEditingInstructor(null);
                setIsFormOpen(true);
              }}
            >
              {t("pages.instructors.createInstructor")}
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerCourses.backToCenter")}
              </Button>
            </Link>
          </>
        }
      />

      {feedback ? (
        <Alert variant="success">
          <AlertTitle>
            {t("pages.instructors.feedback.successTitle")}
          </AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <InstructorsTable
        scopeCenterId={centerId}
        showCenterFilter={false}
        onViewDetails={(instructor) => {
          setFeedback(null);
          setViewingInstructor(instructor);
        }}
        onEdit={(instructor) => {
          setFeedback(null);
          setEditingInstructor(instructor);
          setIsFormOpen(true);
        }}
        onDelete={(instructor) => {
          setFeedback(null);
          setDeletingInstructor(instructor);
        }}
      />

      <InstructorFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingInstructor(null);
        }}
        scopeCenterId={centerId}
        instructor={editingInstructor}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteInstructorDialog
        open={Boolean(deletingInstructor)}
        onOpenChange={(open) => {
          if (!open) setDeletingInstructor(null);
        }}
        instructor={deletingInstructor}
        scopeCenterId={centerId}
        onSuccess={(message) => setFeedback(message)}
      />

      <InstructorDetailsDrawer
        open={Boolean(viewingInstructor)}
        onOpenChange={(open) => {
          if (!open) setViewingInstructor(null);
        }}
        instructor={viewingInstructor}
        scopeCenterId={centerId}
      />
    </div>
  );
}
