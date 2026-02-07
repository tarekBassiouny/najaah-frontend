"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InstructorsTable } from "@/features/instructors/components/InstructorsTable";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import { DeleteInstructorDialog } from "@/features/instructors/components/DeleteInstructorDialog";
import type { Instructor } from "@/features/instructors/types/instructor";

export default function InstructorsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null,
  );
  const [deletingInstructor, setDeletingInstructor] =
    useState<Instructor | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const openCreateDialog = () => {
    setEditingInstructor(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructors"
        description="Manage instructors across centers."
        actions={<Button onClick={openCreateDialog}>Add Instructor</Button>}
      />

      {feedback && (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      <InstructorsTable
        onEdit={(instructor) => {
          setFeedback(null);
          setEditingInstructor(instructor);
          setIsFormOpen(true);
        }}
        onAssignCenters={() => {
          setInfoModal({
            title: "Assign Centers",
            description:
              "Center assignment is not implemented yet for instructors.",
          });
        }}
        onToggleStatus={() => {
          setInfoModal({
            title: "Change Status",
            description: "Status updates are not implemented yet.",
          });
        }}
        onDelete={(instructor) => {
          setFeedback(null);
          setDeletingInstructor(instructor);
        }}
        onBulkAssignCenters={() => {
          setInfoModal({
            title: "Assign Centers",
            description:
              "Bulk center assignment is not implemented yet for instructors.",
          });
        }}
        onBulkChangeStatus={() => {
          setInfoModal({
            title: "Change Status",
            description: "Bulk status updates are not implemented yet.",
          });
        }}
      />

      <InstructorFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingInstructor(null);
        }}
        instructor={editingInstructor}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteInstructorDialog
        open={Boolean(deletingInstructor)}
        onOpenChange={(open) => {
          if (!open) setDeletingInstructor(null);
        }}
        instructor={deletingInstructor}
        onSuccess={(message) => setFeedback(message)}
      />

      <Dialog
        open={Boolean(infoModal)}
        onOpenChange={(open) => {
          if (!open) setInfoModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{infoModal?.title ?? "Action"}</DialogTitle>
            <DialogDescription>
              {infoModal?.description ?? "This action is not available yet."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
