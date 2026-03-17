"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/features/localization";
import type { AssetSlotType, CourseAssetSource } from "../types/asset-catalog";
import { AssetSourceRow } from "./AssetSourceRow";

type GroupedSection = {
  section: { id: number | null; title: string | null };
  sources: CourseAssetSource[];
};

type AssetSectionCardProps = {
  group: GroupedSection;
  centerId: string;
  courseId: string;
  assetsWorkspacePath: string;
  canGenerateAI: boolean;
  canReviewPublishAI: boolean;
  canManageQuizzes: boolean;
  canManageAssignments: boolean;
  canManageLearningAssets: boolean;
  defaultOpen?: boolean;
  onOpenGenerateModal: (
    _source: CourseAssetSource,
    _presetAssetType?: AssetSlotType,
    _presetTargetId?: number | null,
  ) => void;
  onOpenManualDialog: (_source: CourseAssetSource) => void;
  onOpenReviewDialog: (_jobId: number, _batchKey: string | null) => void;
  onOpenBatchDrawer: (_batchKey: string) => void;
};

export function AssetSectionCard({
  group,
  centerId,
  courseId,
  assetsWorkspacePath,
  canGenerateAI,
  canReviewPublishAI,
  canManageQuizzes,
  canManageAssignments,
  canManageLearningAssets,
  defaultOpen = false,
  onOpenGenerateModal,
  onOpenManualDialog,
  onOpenReviewDialog,
  onOpenBatchDrawer,
}: AssetSectionCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <CardTitle>
              {group.section.title ||
                t("pages.courseAssets.labels.unsectioned")}
            </CardTitle>
            <Badge variant="outline">{group.sources.length}</Badge>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </CardHeader>
      {isOpen ? (
        <CardContent className="space-y-4">
          {group.sources.map((source) => (
            <AssetSourceRow
              key={`${source.type}-${source.id}`}
              source={source}
              centerId={centerId}
              courseId={courseId}
              assetsWorkspacePath={assetsWorkspacePath}
              canGenerateAI={canGenerateAI}
              canReviewPublishAI={canReviewPublishAI}
              canManageQuizzes={canManageQuizzes}
              canManageAssignments={canManageAssignments}
              canManageLearningAssets={canManageLearningAssets}
              onOpenGenerateModal={onOpenGenerateModal}
              onOpenManualDialog={onOpenManualDialog}
              onOpenReviewDialog={onOpenReviewDialog}
              onOpenBatchDrawer={onOpenBatchDrawer}
            />
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
