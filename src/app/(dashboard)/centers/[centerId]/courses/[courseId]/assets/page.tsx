"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/components/ui/modal-store";
import { useAssetCatalog } from "@/features/course-assets/hooks/use-asset-catalog";
import { useGenerateForm } from "@/features/course-assets/hooks/use-generate-form";
import { useReviewState } from "@/features/course-assets/hooks/use-review-state";
import { AssetCatalogStatsBar } from "@/features/course-assets/components/AssetCatalogStatsBar";
import { AssetSectionCard } from "@/features/course-assets/components/AssetSectionCard";
import { BatchProgressDrawer } from "@/features/course-assets/components/BatchProgressDrawer";
import { GenerateAssetsDialog } from "@/features/course-assets/components/GenerateAssetsDialog";
import { ManualCreateDialog } from "@/features/course-assets/components/ManualCreateDialog";
import { ReviewDialog } from "@/features/course-assets/components/ReviewDialog";
import type { CourseAssetSource } from "@/features/course-assets/types/asset-catalog";
import type { SelectedSource } from "@/features/course-assets/types/generate-form";
import { groupSourcesBySection } from "@/features/course-builder/utils/group-sources-by-section";
import { useTranslation } from "@/features/localization";
import { can } from "@/lib/capabilities";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

export default function CourseAssetsPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const { t } = useTranslation();
  const { showToast } = useModal();

  const canManageCourses = can("manage_courses");
  const canGenerateAI = can("generate_ai_content");
  const canReviewPublishAI = can("review_publish_ai_content");
  const canManageQuizzes = can("manage_quizzes");
  const canManageAssignments = can("manage_assignments");
  const canManageLearningAssets = can("manage_learning_assets");
  const assetsWorkspacePath = `/centers/${centerId}/courses/${courseId}/assets`;

  const {
    data: catalog,
    isLoading: isCatalogLoading,
    isFetching: isCatalogFetching,
    isError: isCatalogError,
    refetch: refetchCatalog,
  } = useAssetCatalog(centerId, courseId);

  const [activeBatchKey, setActiveBatchKey] = useState<string | null>(null);
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualSource, setManualSource] = useState<SelectedSource | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const generateForm = useGenerateForm({ centerId, courseId });

  const review = useReviewState({
    centerId,
    isOpen: isReviewDialogOpen,
    canGenerateAI,
    canReviewPublishAI,
    refetchCatalog: () => refetchCatalog(),
  });

  const groupedSections = useMemo(
    () => groupSourcesBySection(catalog?.sources ?? []),
    [catalog?.sources],
  );

  const catalogStats = useMemo(() => {
    const summary = {
      sources: catalog?.sources?.length ?? 0,
      generating: 0,
      reviewRequired: 0,
      published: 0,
      failed: 0,
    };

    (catalog?.sources ?? []).forEach((source) => {
      source.assets.forEach((slot) => {
        if (slot.slot_state === "generating") summary.generating += 1;
        if (slot.slot_state === "review_required") summary.reviewRequired += 1;
        if (slot.slot_state === "published") summary.published += 1;
        if (slot.slot_state === "failed") summary.failed += 1;
      });
    });

    return summary;
  }, [catalog?.sources]);

  const openManualDialog = (source: CourseAssetSource) => {
    setManualSource({
      type: source.type,
      id: Number(source.id),
      title: source.title,
      sectionTitle: source.section?.title ?? null,
    });
    setIsManualDialogOpen(true);
  };

  const openReviewDialog = (jobId: number, batchKey: string | null) => {
    if (batchKey?.trim()) {
      setActiveBatchKey(batchKey.trim());
    }
    review.openReviewDialog(jobId);
    setIsBatchDrawerOpen(false);
    setIsReviewDialogOpen(true);
  };

  const openBatchDrawer = (batchKey: string) => {
    setActiveBatchKey(batchKey);
    setIsBatchDrawerOpen(true);
  };

  const handleGenerateSubmit = async () => {
    const batchKey = await generateForm.handleGenerateSubmit();
    if (batchKey) {
      setActiveBatchKey(batchKey);
      setIsBatchDrawerOpen(true);
    }
  };

  if (!canManageCourses) {
    return (
      <Alert>
        <AlertTitle>{t("pages.courseAssets.permission.title")}</AlertTitle>
        <AlertDescription>
          {t("pages.courseAssets.permission.description")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.courseAssets.title")}
        description={t("pages.courseAssets.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/centers/${centerId}/courses/${courseId}`}>
              <Button variant="outline">
                {t("pages.courseAssets.actions.backToCourse")}
              </Button>
            </Link>
          </div>
        }
      />

      {!isCatalogLoading ? <AssetCatalogStatsBar stats={catalogStats} /> : null}

      {isCatalogError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
          <AlertDescription>
            {t("pages.courseAssets.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      ) : null}

      {isCatalogLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      ) : groupedSections.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t("pages.courseAssets.emptyTitle")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedSections.map((group) => (
          <AssetSectionCard
            key={`section-${group.section.id ?? "none"}`}
            group={group}
            centerId={centerId}
            courseId={courseId}
            assetsWorkspacePath={assetsWorkspacePath}
            canGenerateAI={canGenerateAI}
            canReviewPublishAI={canReviewPublishAI}
            canManageQuizzes={canManageQuizzes}
            canManageAssignments={canManageAssignments}
            canManageLearningAssets={canManageLearningAssets}
            onOpenGenerateModal={generateForm.openGenerateModal}
            onOpenManualDialog={openManualDialog}
            onOpenReviewDialog={openReviewDialog}
            onOpenBatchDrawer={openBatchDrawer}
          />
        ))
      )}

      <GenerateAssetsDialog
        open={generateForm.isOpen}
        onOpenChange={generateForm.setIsOpen}
        selectedSource={generateForm.selectedSource}
        generateForm={generateForm.generateForm}
        onFormChange={generateForm.setGenerateForm}
        generateError={generateForm.generateError}
        isCreatingBatch={generateForm.isCreatingBatch}
        selectedAssetsCount={generateForm.selectedAssetsCount}
        onSubmit={() => void handleGenerateSubmit()}
      />

      <ManualCreateDialog
        open={isManualDialogOpen}
        onOpenChange={(open) => {
          setIsManualDialogOpen(open);
          if (!open) setManualSource(null);
        }}
        source={manualSource}
        centerId={centerId}
        courseId={courseId}
        returnTo={assetsWorkspacePath}
        canManageQuizzes={canManageQuizzes}
        canManageAssignments={canManageAssignments}
      />

      <BatchProgressDrawer
        open={isBatchDrawerOpen}
        onOpenChange={setIsBatchDrawerOpen}
        centerId={centerId}
        courseId={courseId}
        batchKey={activeBatchKey}
        canReviewPublishAI={canReviewPublishAI}
        isCatalogFetching={isCatalogFetching}
        onReviewJob={openReviewDialog}
        onRefreshCatalog={async () => {
          await refetchCatalog();
          showToast(t("pages.courseAssets.toasts.refreshed"), "success");
        }}
      />

      <ReviewDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        review={review}
        canReviewPublishAI={canReviewPublishAI}
      />
    </div>
  );
}
