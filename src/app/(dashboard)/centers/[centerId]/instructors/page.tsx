"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InstructorsTable } from "@/features/instructors/components/InstructorsTable";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import { DeleteInstructorDialog } from "@/features/instructors/components/DeleteInstructorDialog";
import type { Instructor } from "@/features/instructors/types/instructor";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterInstructorsPage({ params }: PageProps) {
  const { centerId } = use(params);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null,
  );
  const [deletingInstructor, setDeletingInstructor] =
    useState<Instructor | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructors"
        description="Manage instructors for this center."
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Instructors" },
        ]}
        actions={
          <>
            <Button
              onClick={() => {
                setEditingInstructor(null);
                setIsFormOpen(true);
              }}
            >
              Add Instructor
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          </>
        }
      />

      {feedback ? (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <InstructorsTable
        scopeCenterId={centerId}
        showCenterFilter={false}
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
    </div>
  );
}
