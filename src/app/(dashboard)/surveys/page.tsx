"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AssignSurveyDialog } from "@/features/surveys/components/AssignSurveyDialog";
import { BulkCloseSurveysDialog } from "@/features/surveys/components/BulkCloseSurveysDialog";
import { BulkDeleteSurveysDialog } from "@/features/surveys/components/BulkDeleteSurveysDialog";
import { BulkUpdateSurveyStatusDialog } from "@/features/surveys/components/BulkUpdateSurveyStatusDialog";
import { CloseSurveyDialog } from "@/features/surveys/components/CloseSurveyDialog";
import { DeleteSurveyDialog } from "@/features/surveys/components/DeleteSurveyDialog";
import { SurveyFormDialog } from "@/features/surveys/components/SurveyFormDialog";
import { SurveyResultsDrawer } from "@/features/surveys/components/SurveyResultsDrawer";
import type { SurveyResultsTab } from "@/features/surveys/components/SurveyResultsDrawer";
import { SurveysTable } from "@/features/surveys/components/SurveysTable";
import { UpdateSurveyStatusDialog } from "@/features/surveys/components/UpdateSurveyStatusDialog";
import type { Survey } from "@/features/surveys/types/survey";

function parseResultsTab(value: string | null): SurveyResultsTab | undefined {
  if (value === "overview") return "overview";
  if (value === "questions") return "questions";
  if (value === "responses") return "responses";
  if (value === "raw") return "raw";
  return undefined;
}

export default function SurveysPage() {
  const searchParams = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [assigningSurvey, setAssigningSurvey] = useState<Survey | null>(null);
  const [closingSurvey, setClosingSurvey] = useState<Survey | null>(null);
  const [statusSurvey, setStatusSurvey] = useState<Survey | null>(null);
  const [bulkStatusSurveys, setBulkStatusSurveys] = useState<Survey[]>([]);
  const [bulkCloseSurveys, setBulkCloseSurveys] = useState<Survey[]>([]);
  const [bulkDeleteSurveys, setBulkDeleteSurveys] = useState<Survey[]>([]);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [viewingResultsSurvey, setViewingResultsSurvey] =
    useState<Survey | null>(null);
  const [resultsInitialTab, setResultsInitialTab] = useState<
    SurveyResultsTab | undefined
  >(undefined);
  const [handledResultsDeepLink, setHandledResultsDeepLink] = useState<
    string | null
  >(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const deepLinkSurveyId = searchParams.get("open_results_survey_id");
  const deepLinkTab = parseResultsTab(searchParams.get("focus_tab"));

  useEffect(() => {
    const normalizedId = deepLinkSurveyId?.trim();
    if (!normalizedId) return;

    const deepLinkKey = `${normalizedId}:${deepLinkTab ?? ""}`;
    if (handledResultsDeepLink === deepLinkKey) return;

    setHandledResultsDeepLink(deepLinkKey);
    setFeedback(null);
    setResultsInitialTab(deepLinkTab ?? "responses");
    setViewingResultsSurvey({ id: normalizedId } as Survey);
  }, [deepLinkSurveyId, deepLinkTab, handledResultsDeepLink]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys"
        description="Manage system and center surveys"
        actions={
          <Button
            onClick={() => {
              setFeedback(null);
              setIsFormOpen(true);
            }}
          >
            Add Survey
          </Button>
        }
      />

      {feedback ? (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <SurveysTable
        onEdit={(survey) => {
          setFeedback(null);
          setEditingSurvey(survey);
        }}
        onAssign={(survey) => {
          setFeedback(null);
          setAssigningSurvey(survey);
        }}
        onChangeStatus={(survey) => {
          setFeedback(null);
          setStatusSurvey(survey);
        }}
        onClose={(survey) => {
          setFeedback(null);
          setClosingSurvey(survey);
        }}
        onBulkChangeStatus={(surveys) => {
          setFeedback(null);
          setBulkStatusSurveys(surveys);
        }}
        onBulkClose={(surveys) => {
          setFeedback(null);
          setBulkCloseSurveys(surveys);
        }}
        onBulkDelete={(surveys) => {
          setFeedback(null);
          setBulkDeleteSurveys(surveys);
        }}
        onDelete={(survey) => {
          setFeedback(null);
          setDeletingSurvey(survey);
        }}
        onViewResults={(survey) => {
          setResultsInitialTab(undefined);
          setViewingResultsSurvey(survey);
        }}
      />

      <SurveyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        centerId={null}
        onSuccess={(message) => setFeedback(message)}
      />
      <SurveyFormDialog
        open={Boolean(editingSurvey)}
        onOpenChange={(open) => {
          if (!open) setEditingSurvey(null);
        }}
        centerId={editingSurvey?.center_id ?? null}
        survey={editingSurvey}
        onSuccess={(message) => setFeedback(message)}
      />

      <AssignSurveyDialog
        open={Boolean(assigningSurvey)}
        onOpenChange={(open) => {
          if (!open) setAssigningSurvey(null);
        }}
        centerId={assigningSurvey?.center_id ?? null}
        survey={assigningSurvey}
        onSuccess={(message) => setFeedback(message)}
      />

      <UpdateSurveyStatusDialog
        open={Boolean(statusSurvey)}
        onOpenChange={(open) => {
          if (!open) setStatusSurvey(null);
        }}
        centerId={statusSurvey?.center_id ?? null}
        survey={statusSurvey}
        onSuccess={(message) => setFeedback(message)}
      />

      <CloseSurveyDialog
        open={Boolean(closingSurvey)}
        onOpenChange={(open) => {
          if (!open) setClosingSurvey(null);
        }}
        centerId={closingSurvey?.center_id ?? null}
        survey={closingSurvey}
        onSuccess={(message) => setFeedback(message)}
      />

      <BulkUpdateSurveyStatusDialog
        open={bulkStatusSurveys.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkStatusSurveys([]);
        }}
        centerId={null}
        surveys={bulkStatusSurveys}
        onSuccess={(message) => setFeedback(message)}
      />

      <BulkCloseSurveysDialog
        open={bulkCloseSurveys.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkCloseSurveys([]);
        }}
        centerId={null}
        surveys={bulkCloseSurveys}
        onSuccess={(message) => setFeedback(message)}
      />

      <BulkDeleteSurveysDialog
        open={bulkDeleteSurveys.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteSurveys([]);
        }}
        centerId={null}
        surveys={bulkDeleteSurveys}
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
        centerId={deletingSurvey?.center_id ?? null}
        onSuccess={(message) => setFeedback(message)}
      />

      <SurveyResultsDrawer
        open={Boolean(viewingResultsSurvey)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingResultsSurvey(null);
            setResultsInitialTab(undefined);
          }
        }}
        survey={viewingResultsSurvey}
        centerId={viewingResultsSurvey?.center_id ?? null}
        initialTab={resultsInitialTab}
      />
    </div>
  );
}
