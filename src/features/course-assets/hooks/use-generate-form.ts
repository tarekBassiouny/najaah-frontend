import { useMemo, useState } from "react";
import { useModal } from "@/components/ui/modal-store";
import { useCreateAIBatch } from "@/features/ai/hooks/use-ai";
import { mapAIErrorCodeToMessage } from "@/features/ai/lib/error-mapper";
import type {
  AIContentLanguage,
  CreateAIBatchRequest,
} from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import { usePdf } from "@/features/pdfs/hooks/use-pdfs";
import { useVideoTranscript } from "@/features/videos/hooks/use-videos";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";
import { toAssetBatchPayload } from "../lib/build-batch-payload";
import { resolveCourseAssetSourceReadiness } from "../lib/source-readiness";
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
  const [language, setLanguage] = useState<AIContentLanguage>("ar");
  const [generateError, setGenerateError] = useState<string | null>(null);

  const { mutateAsync: createBatch, isPending: isCreatingBatch } =
    useCreateAIBatch();

  const selectedAssetsCount = useMemo(
    () =>
      Number(generateForm.summary) +
      Number(generateForm.quiz) +
      Number(generateForm.flashcards) +
      Number(generateForm.assignment) +
      Number(generateForm.interactive_activity),
    [
      generateForm.assignment,
      generateForm.flashcards,
      generateForm.interactive_activity,
      generateForm.quiz,
      generateForm.summary,
    ],
  );

  const selectedVideoId =
    isOpen && selectedSource?.type === "video" ? selectedSource.id : undefined;
  const selectedPdfId =
    isOpen && selectedSource?.type === "pdf" ? selectedSource.id : undefined;

  const {
    data: selectedVideoTranscript,
    isFetching: isVideoTranscriptFetching,
    isFetched: isVideoTranscriptFetched,
    refetch: refetchSelectedVideoTranscript,
  } = useVideoTranscript(centerId, selectedVideoId, {
    enabled: selectedVideoId != null,
    retry: false,
    staleTime: 0,
  });

  const {
    data: selectedPdfResource,
    isFetching: isPdfReadinessFetching,
    isFetched: isPdfReadinessFetched,
    refetch: refetchSelectedPdfResource,
  } = usePdf(centerId, selectedPdfId, {
    enabled: selectedPdfId != null,
    retry: false,
    staleTime: 0,
  });

  const readinessSource = useMemo(() => {
    if (!selectedSource) {
      return null;
    }

    if (selectedSource.type === "video") {
      if (isVideoTranscriptFetched) {
        return {
          ...selectedSource,
          ...(selectedVideoTranscript ?? { has_transcript: false }),
        };
      }
      return selectedSource;
    }

    if (selectedSource.type === "pdf") {
      return selectedPdfResource
        ? {
            ...selectedSource,
            id: Number(selectedPdfResource.id ?? selectedSource.id),
            title: selectedPdfResource.title ?? selectedSource.title,
            has_extracted_text: selectedPdfResource.has_extracted_text,
            text_extraction_status: selectedPdfResource.text_extraction_status,
            text_extraction_status_label:
              selectedPdfResource.text_extraction_status_label,
          }
        : selectedSource;
    }

    return selectedSource;
  }, [
    isVideoTranscriptFetched,
    selectedPdfResource,
    selectedSource,
    selectedVideoTranscript,
  ]);

  const sourceReadiness = useMemo(
    () => resolveCourseAssetSourceReadiness(readinessSource),
    [readinessSource],
  );

  const isSourceReadinessLoading = useMemo(() => {
    if (!isOpen || !selectedSource) {
      return false;
    }

    if (selectedSource.type === "video") {
      return !isVideoTranscriptFetched && isVideoTranscriptFetching;
    }

    if (selectedSource.type === "pdf") {
      return !isPdfReadinessFetched && isPdfReadinessFetching;
    }

    return false;
  }, [
    isOpen,
    isPdfReadinessFetched,
    isPdfReadinessFetching,
    isVideoTranscriptFetched,
    isVideoTranscriptFetching,
    selectedSource,
  ]);

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
      nextState.interactive_activity =
        presetAssetType === "interactive_activity";
    }

    setGenerateForm(nextState);
    setLanguage("ar");
    setGenerateError(null);
    setSelectedSource({
      type: source.type,
      id: Number(source.id),
      title: source.title,
      sectionTitle: source.section?.title ?? null,
      ai_readiness: source.ai_readiness ?? null,
      has_transcript: source.has_transcript,
      transcript_format: source.transcript_format,
      transcript_source: source.transcript_source,
      has_extracted_text: source.has_extracted_text,
      text_extraction_status: source.text_extraction_status,
      text_extraction_status_label: source.text_extraction_status_label,
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

    let validatedReadiness = sourceReadiness;

    if (selectedSource.type === "video") {
      const transcriptResult = await refetchSelectedVideoTranscript();
      validatedReadiness = transcriptResult.error
        ? {
            key: "unknown",
            isReady: false,
            isKnown: false,
          }
        : resolveCourseAssetSourceReadiness({
            ...selectedSource,
            ...(transcriptResult.data ?? { has_transcript: false }),
          });
    } else if (selectedSource.type === "pdf") {
      const pdfResult = await refetchSelectedPdfResource();
      validatedReadiness = pdfResult.error
        ? {
            key: "unknown",
            isReady: false,
            isKnown: false,
          }
        : resolveCourseAssetSourceReadiness(
            pdfResult.data
              ? {
                  ...selectedSource,
                  id: Number(pdfResult.data.id ?? selectedSource.id),
                  title: pdfResult.data.title ?? selectedSource.title,
                  has_extracted_text: pdfResult.data.has_extracted_text,
                  text_extraction_status: pdfResult.data.text_extraction_status,
                  text_extraction_status_label:
                    pdfResult.data.text_extraction_status_label,
                }
              : {
                  ...selectedSource,
                  has_extracted_text: null,
                  text_extraction_status: null,
                },
          );
    }

    if (!validatedReadiness.isReady) {
      setGenerateError(
        t(`pages.courseAssets.readiness.${validatedReadiness.key}.description`),
      );
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
      language,
      assets: aiAssets,
    };

    try {
      const response = await createBatch({ centerId, payload });
      setIsOpen(false);
      showToast(t("pages.courseAssets.toasts.batchCreated"), "success");
      return response.data.batch_key;
    } catch (error) {
      setGenerateError(
        mapAIErrorCodeToMessage(
          getAdminApiErrorCode(error),
          getAdminApiErrorMessage(
            error,
            t("pages.courseAssets.errors.batchCreateFailed"),
          ),
        ),
      );
      return null;
    }
  };

  return {
    selectedSource,
    isOpen,
    setIsOpen,
    generateForm,
    setGenerateForm,
    language,
    setLanguage,
    generateError,
    sourceReadiness,
    isSourceReadinessLoading,
    isCreatingBatch,
    selectedAssetsCount,
    openGenerateModal,
    handleGenerateSubmit,
  };
}
