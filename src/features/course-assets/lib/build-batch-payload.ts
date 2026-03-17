import type { CreateAIBatchAssetRequest } from "@/features/ai/types/ai";
import type { GenerateFormState, SelectedSource } from "../types/generate-form";

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
        question_count: Number(generateForm.quizQuestionCount || 10),
        difficulty: generateForm.quizDifficulty,
        question_styles: questionStyles,
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
        card_count: Number(generateForm.flashcardsCount || 15),
        focus,
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
        submission_types: submissionTypes,
        max_points: Number(generateForm.assignmentMaxPoints || 100),
      },
    });
  }

  return assets;
}
