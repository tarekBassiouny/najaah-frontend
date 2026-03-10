"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTenant } from "@/app/tenant-provider";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { useTranslation } from "@/features/localization";
import { getAdminScope } from "@/lib/user-scope";
import { InstructorsTable } from "@/features/instructors/components/InstructorsTable";
import { InstructorFormDialog } from "@/features/instructors/components/InstructorFormDialog";
import { DeleteInstructorDialog } from "@/features/instructors/components/DeleteInstructorDialog";
import { InstructorDetailsDrawer } from "@/features/instructors/components/InstructorDetailsDrawer";
import type { Instructor } from "@/features/instructors/types/instructor";

export default function InstructorsPage() {
  const { t } = useTranslation();
  const tenant = useTenant();
  const { data: user } = useAdminMe();
  const userScope = getAdminScope(user);
  const isCenterAdmin = userScope.isCenterAdmin;
  const scopeCenterId = isCenterAdmin ? userScope.centerId : null;
  const selectedCenterId = isCenterAdmin
    ? userScope.centerId
    : (tenant.centerId ?? null);
  const canManageCenterInstructors = selectedCenterId != null;

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

  const openCreateDialog = () => {
    if (!canManageCenterInstructors) return;
    setEditingInstructor(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.instructors.title")}
        description={t("pages.instructors.descriptionByCenter")}
        actions={
          <Button
            onClick={openCreateDialog}
            disabled={!canManageCenterInstructors}
          >
            {t("pages.instructors.createInstructor")}
          </Button>
        }
      />

      {!canManageCenterInstructors ? (
        <Alert variant="default">
          <AlertTitle>{t("pages.instructors.selectCenterTitle")}</AlertTitle>
          <AlertDescription>
            {t("pages.instructors.selectCenterDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      {feedback && (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      <InstructorsTable
        scopeCenterId={scopeCenterId}
        showCenterFilter={!isCenterAdmin}
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
        scopeCenterId={selectedCenterId}
        instructor={editingInstructor}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteInstructorDialog
        open={Boolean(deletingInstructor)}
        onOpenChange={(open) => {
          if (!open) setDeletingInstructor(null);
        }}
        instructor={deletingInstructor}
        scopeCenterId={selectedCenterId}
        onSuccess={(message) => setFeedback(message)}
      />

      <InstructorDetailsDrawer
        open={Boolean(viewingInstructor)}
        onOpenChange={(open) => {
          if (!open) setViewingInstructor(null);
        }}
        instructor={viewingInstructor}
        scopeCenterId={selectedCenterId}
      />
    </div>
  );
}
