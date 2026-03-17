import { useMemo, useState } from "react";
import { useModal } from "@/components/ui/modal-store";
import { useCreateAIBatch } from "@/features/ai/hooks/use-ai";
import type { CreateAIBatchRequest } from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import { toAssetBatchPayload } from "../lib/build-batch-payload";
import type { CourseAssetSource } from "../types/asset-catalog";
import type { AssetSlotType } from "../types/asset-catalog";
import {
  type GenerateFormState,
  type SelectedSource,
  defaultGenerateFormState,
} from "../types/generate-form";

type UseGenerateFormParams = {
  centerId: string;
  courseId: string;
};

export function useGenerateForm({ centerId, courseId }: UseGenerateFormParams) {
  const { t } = useTranslation();
  const { showToast } = useModal();

  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateFormState>(
    defaultGenerateFormState,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { mutateAsync: createBatch, isPending: isCreatingBatch } =
    useCreateAIBatch();

  const selectedAssetsCount = useMemo(
    () =>
      Number(generateForm.summary) +
      Number(generateForm.quiz) +
      Number(generateForm.flashcards) +
      Number(generateForm.assignment),
    [
      generateForm.assignment,
      generateForm.flashcards,
      generateForm.quiz,
      generateForm.summary,
    ],
  );

  const openGenerateModal = (
    source: CourseAssetSource,
    presetAssetType?: AssetSlotType,
    presetTargetId?: number | null,
  ) => {
    const nextState = defaultGenerateFormState();
    if (presetAssetType) {
      nextState.summary = presetAssetType === "summary";
      nextState.quiz = presetAssetType === "quiz";
      nextState.flashcards = presetAssetType === "flashcards";
      nextState.assignment = presetAssetType === "assignment";
    }

    setGenerateForm(nextState);
    setGenerateError(null);
    setSelectedSource({
      type: source.type,
      id: Number(source.id),
      title: source.title,
      sectionTitle: source.section?.title ?? null,
      presetAssetType,
      presetTargetId: presetTargetId ?? null,
    });
    setIsOpen(true);
  };

  const handleGenerateSubmit = async (): Promise<string | null> => {
    if (!selectedSource) return null;

    setGenerateError(null);

    if (selectedAssetsCount === 0) {
      setGenerateError(t("pages.courseAssets.errors.selectAsset"));
      return null;
    }

    const aiAssets = toAssetBatchPayload(generateForm, selectedSource);

    if (aiAssets.length === 0) {
      setGenerateError(t("pages.courseAssets.errors.selectAsset"));
      return null;
    }

    const payload: CreateAIBatchRequest = {
      course_id: Number(courseId),
      source_type: selectedSource.type,
      source_id: selectedSource.id,
      assets: aiAssets,
    };

    try {
      const response = await createBatch({ centerId, payload });
      setIsOpen(false);
      showToast(t("pages.courseAssets.toasts.batchCreated"), "success");
      return response.data.batch_key;
    } catch {
      setGenerateError(t("pages.courseAssets.errors.batchCreateFailed"));
      return null;
    }
  };

  return {
    selectedSource,
    isOpen,
    setIsOpen,
    generateForm,
    setGenerateForm,
    generateError,
    isCreatingBatch,
    selectedAssetsCount,
    openGenerateModal,
    handleGenerateSubmit,
  };
}
