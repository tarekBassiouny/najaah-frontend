'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DeleteSurveyDialog } from '@/features/surveys/components/DeleteSurveyDialog';
import { SurveyFormDialog } from '@/features/surveys/components/SurveyFormDialog';
import { SurveyResultsDrawer } from '@/features/surveys/components/SurveyResultsDrawer';
import { SurveysTable } from '@/features/surveys/components/SurveysTable';
import type { Survey } from '@/features/surveys/types/survey';

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterSurveysPage({ params }: PageProps) {
  const { centerId } = use(params);
  const parsedCenterId = Number(centerId);
  const centerIdForApis = Number.isFinite(parsedCenterId)
    ? parsedCenterId
    : undefined;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [viewingResultsSurvey, setViewingResultsSurvey] =
    useState<Survey | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Surveys"
        description="Manage surveys for this center"
        breadcrumbs={[
          { label: 'Centers', href: '/centers' },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: 'Surveys' },
        ]}
        actions={
          <>
            <Button
              onClick={() => {
                setFeedback(null);
                setIsFormOpen(true);
              }}
            >
              Create Center Survey
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

      <SurveysTable
        centerId={centerIdForApis}
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
        centerId={centerIdForApis}
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
