"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
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
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useTranslation } from "@/features/localization";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

function parseResultsTab(value: string | null): SurveyResultsTab | undefined {
  if (value === "overview") return "overview";
  if (value === "questions") return "questions";
  if (value === "responses") return "responses";
  if (value === "raw") return "raw";
  return undefined;
}

function isUnbrandedCenterType(type: unknown) {
  if (type == null) return false;

  if (typeof type === "number") {
    return type === 0;
  }

  if (typeof type === "string") {
    const normalized = type.trim().toLowerCase();
    return normalized === "0" || normalized === "unbranded";
  }

  return false;
}

export default function CenterSurveysPage({ params }: PageProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { centerId } = use(params);
  const parsedCenterId = Number(centerId);
  const centerIdForApis = Number.isFinite(parsedCenterId)
    ? parsedCenterId
    : undefined;
  const { data: center } = useCenter(centerIdForApis);
  const isUnbrandedCenter = isUnbrandedCenterType(center?.type);
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
    setViewingResultsSurvey({
      id: normalizedId,
      center_id: centerIdForApis ?? null,
    } as Survey);
  }, [deepLinkSurveyId, deepLinkTab, handledResultsDeepLink, centerIdForApis]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerSurveys.title")}
        description={
          isUnbrandedCenter
            ? t("pages.centerSurveys.descriptionUnbranded")
            : t("pages.centerSurveys.description")
        }
        actions={
          <>
            {!isUnbrandedCenter ? (
              <Button
                onClick={() => {
                  setFeedback(null);
                  setIsFormOpen(true);
                }}
              >
                {t("pages.centerSurveys.createSurvey")}
              </Button>
            ) : null}
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerCourses.backToCenter")}
              </Button>
            </Link>
          </>
        }
      />

      {isUnbrandedCenter ? (
        <Alert>
          <AlertTitle>{t("pages.centerSurveys.disabledTitle")}</AlertTitle>
          <AlertDescription>
            {t("pages.centerSurveys.disabledDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      {feedback ? (
        <Alert variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      {!isUnbrandedCenter ? (
        <SurveysTable
          centerId={centerIdForApis}
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
      ) : null}

      {!isUnbrandedCenter ? (
        <>
          <SurveyFormDialog
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            centerId={centerIdForApis}
            onSuccess={(message) => setFeedback(message)}
          />
          <SurveyFormDialog
            open={Boolean(editingSurvey)}
            onOpenChange={(open) => {
              if (!open) setEditingSurvey(null);
            }}
            centerId={centerIdForApis}
            survey={editingSurvey}
            onSuccess={(message) => setFeedback(message)}
          />
        </>
      ) : null}

      {!isUnbrandedCenter ? (
        <AssignSurveyDialog
          open={Boolean(assigningSurvey)}
          onOpenChange={(open) => {
            if (!open) setAssigningSurvey(null);
          }}
          centerId={centerIdForApis}
          survey={assigningSurvey}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <UpdateSurveyStatusDialog
          open={Boolean(statusSurvey)}
          onOpenChange={(open) => {
            if (!open) setStatusSurvey(null);
          }}
          centerId={statusSurvey?.center_id ?? centerIdForApis}
          survey={statusSurvey}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <CloseSurveyDialog
          open={Boolean(closingSurvey)}
          onOpenChange={(open) => {
            if (!open) setClosingSurvey(null);
          }}
          centerId={centerIdForApis}
          survey={closingSurvey}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <BulkUpdateSurveyStatusDialog
          open={bulkStatusSurveys.length > 0}
          onOpenChange={(open) => {
            if (!open) setBulkStatusSurveys([]);
          }}
          centerId={centerIdForApis}
          surveys={bulkStatusSurveys}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <BulkCloseSurveysDialog
          open={bulkCloseSurveys.length > 0}
          onOpenChange={(open) => {
            if (!open) setBulkCloseSurveys([]);
          }}
          centerId={centerIdForApis}
          surveys={bulkCloseSurveys}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <BulkDeleteSurveysDialog
          open={bulkDeleteSurveys.length > 0}
          onOpenChange={(open) => {
            if (!open) setBulkDeleteSurveys([]);
          }}
          centerId={centerIdForApis}
          surveys={bulkDeleteSurveys}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <DeleteSurveyDialog
          open={Boolean(deletingSurvey)}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingSurvey(null);
            }
          }}
          survey={deletingSurvey}
          centerId={centerIdForApis}
          onSuccess={(message) => setFeedback(message)}
        />
      ) : null}

      {!isUnbrandedCenter ? (
        <SurveyResultsDrawer
          open={Boolean(viewingResultsSurvey)}
          onOpenChange={(open) => {
            if (!open) {
              setViewingResultsSurvey(null);
              setResultsInitialTab(undefined);
            }
          }}
          survey={viewingResultsSurvey}
          centerId={centerIdForApis}
          initialTab={resultsInitialTab}
        />
      ) : null}
    </div>
  );
}
