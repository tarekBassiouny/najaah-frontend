"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { DeleteSurveyDialog } from "@/features/surveys/components/DeleteSurveyDialog";
import { SurveyFormDialog } from "@/features/surveys/components/SurveyFormDialog";
import { SurveyResultsDrawer } from "@/features/surveys/components/SurveyResultsDrawer";
import { SurveysTable } from "@/features/surveys/components/SurveysTable";
import type { Survey } from "@/features/surveys/types/survey";

export default function SurveysPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [viewingResultsSurvey, setViewingResultsSurvey] =
    useState<Survey | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys"
        description="Manage system and center surveys"
        actions={
          <>
            <CenterPicker className="hidden md:block md:w-56" />
            <Button
              onClick={() => {
                setFeedback(null);
                setIsFormOpen(true);
              }}
            >
              Create System Survey
            </Button>
          </>
        }
      />

      {feedback ? (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <SurveysTable
        onDelete={(survey) => {
          setFeedback(null);
          setDeletingSurvey(survey);
        }}
        onViewResults={(survey) => {
          setViewingResultsSurvey(survey);
        }}
      />

      <SurveyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        centerId={null}
        onSuccess={(message) => setFeedback(message)}
      />

      <DeleteSurveyDialog
        open={Boolean(deletingSurvey)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSurvey(null);
          }
        }}
        survey={deletingSurvey}
        onSuccess={(message) => setFeedback(message)}
      />

      <SurveyResultsDrawer
        open={Boolean(viewingResultsSurvey)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingResultsSurvey(null);
          }
        }}
        survey={viewingResultsSurvey}
      />
    </div>
  );
}
