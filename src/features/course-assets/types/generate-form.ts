import type { AssetSlotType } from "./asset-catalog";

export type SelectedSource = {
  type: "video" | "pdf";
  id: number;
  title: string | null;
  sectionTitle: string | null;
  presetAssetType?: AssetSlotType;
  presetTargetId?: number | null;
};

export type GenerateFormState = {
  summary: boolean;
  quiz: boolean;
  flashcards: boolean;
  assignment: boolean;
  summaryLength: "short" | "medium" | "long";
  summaryIncludeKeyPoints: boolean;
  quizQuestionCount: string;
  quizDifficulty: "easy" | "medium" | "hard";
  quizStyleSingleChoice: boolean;
  quizStyleMultipleChoice: boolean;
  quizStyleTrueFalse: boolean;
  flashcardsCount: string;
  flashcardsFocusDefinitions: boolean;
  flashcardsFocusConcepts: boolean;
  flashcardsFocusFormulas: boolean;
  assignmentStyle: "practice" | "essay" | "project";
  assignmentAllowFile: boolean;
  assignmentAllowText: boolean;
  assignmentAllowLink: boolean;
  assignmentMaxPoints: string;
};

export const SLOT_ORDER: AssetSlotType[] = [
  "summary",
  "quiz",
  "flashcards",
  "assignment",
];

export function defaultGenerateFormState(): GenerateFormState {
  return {
    summary: true,
    quiz: true,
    flashcards: true,
    assignment: false,
    summaryLength: "medium",
    summaryIncludeKeyPoints: true,
    quizQuestionCount: "10",
    quizDifficulty: "medium",
    quizStyleSingleChoice: true,
    quizStyleMultipleChoice: false,
    quizStyleTrueFalse: true,
    flashcardsCount: "15",
    flashcardsFocusDefinitions: true,
    flashcardsFocusConcepts: true,
    flashcardsFocusFormulas: false,
    assignmentStyle: "practice",
    assignmentAllowFile: true,
    assignmentAllowText: true,
    assignmentAllowLink: false,
    assignmentMaxPoints: "100",
  };
}
