import type { CreateAIBatchAssetRequest } from "@/features/ai/types/ai";
import type { GenerateFormState, SelectedSource } from "../types/generate-form";

function toBoundedPositiveInt(
  value: string,
  fallback: number,
  options?: { min?: number; max?: number },
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const min = options?.min ?? 1;
  const max = options?.max;
  const normalized = Math.max(min, Math.trunc(parsed));

  if (max == null) {
    return normalized;
  }

  return Math.min(normalized, max);
}

export function toAssetBatchPayload(
  generateForm: GenerateFormState,
  selectedSource: SelectedSource,
): CreateAIBatchAssetRequest[] {
  const assets: CreateAIBatchAssetRequest[] = [];

  if (generateForm.summary) {
    assets.push({
      target_type: "summary",
      target_id:
        selectedSource.presetAssetType === "summary"
          ? selectedSource.presetTargetId
          : null,
      generation_config: {
        length: generateForm.summaryLength,
        include_key_points: generateForm.summaryIncludeKeyPoints,
      },
    });
  }

  if (generateForm.quiz) {
    const questionStyles: Array<
      "single_choice" | "multiple_choice" | "true_false"
    > = [];
    if (generateForm.quizStyleSingleChoice)
      questionStyles.push("single_choice");
    if (generateForm.quizStyleMultipleChoice) {
      questionStyles.push("multiple_choice");
    }
    if (generateForm.quizStyleTrueFalse) questionStyles.push("true_false");

    assets.push({
      target_type: "quiz",
      target_id:
        selectedSource.presetAssetType === "quiz"
          ? selectedSource.presetTargetId
          : null,
      generation_config: {
        question_count: toBoundedPositiveInt(
          generateForm.quizQuestionCount,
          10,
          {
            min: 1,
            max: 50,
          },
        ),
        difficulty: generateForm.quizDifficulty,
        question_styles:
          questionStyles.length > 0 ? questionStyles : ["single_choice"],
      },
    });
  }

  if (generateForm.flashcards) {
    const focus: Array<"definitions" | "concepts" | "formulas"> = [];
    if (generateForm.flashcardsFocusDefinitions) focus.push("definitions");
    if (generateForm.flashcardsFocusConcepts) focus.push("concepts");
    if (generateForm.flashcardsFocusFormulas) focus.push("formulas");

    assets.push({
      target_type: "flashcards",
      target_id:
        selectedSource.presetAssetType === "flashcards"
          ? selectedSource.presetTargetId
          : null,
      generation_config: {
        card_count: toBoundedPositiveInt(generateForm.flashcardsCount, 15, {
          min: 1,
          max: 100,
        }),
        focus: focus.length > 0 ? focus : ["definitions"],
      },
    });
  }

  if (generateForm.assignment) {
    const submissionTypes: number[] = [];
    if (generateForm.assignmentAllowFile) submissionTypes.push(0);
    if (generateForm.assignmentAllowText) submissionTypes.push(1);
    if (generateForm.assignmentAllowLink) submissionTypes.push(2);

    assets.push({
      target_type: "assignment",
      target_id:
        selectedSource.presetAssetType === "assignment"
          ? selectedSource.presetTargetId
          : null,
      generation_config: {
        assignment_style: generateForm.assignmentStyle,
        submission_types: submissionTypes.length > 0 ? submissionTypes : [0],
        max_points: toBoundedPositiveInt(generateForm.assignmentMaxPoints, 100),
      },
    });
  }

  if (generateForm.interactive_activity) {
    assets.push({
      target_type: "interactive_activity",
      target_id:
        selectedSource.presetAssetType === "interactive_activity"
          ? selectedSource.presetTargetId
          : null,
      generation_config: {
        activity_style: generateForm.interactiveActivityStyle,
        steps_count: toBoundedPositiveInt(
          generateForm.interactiveActivityStepsCount,
          5,
          {
            min: 1,
            max: 20,
          },
        ),
        include_reflection: generateForm.interactiveActivityIncludeReflection,
      },
    });
  }

  return assets;
}
