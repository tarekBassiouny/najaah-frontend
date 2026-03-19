import type { AIReadiness, AssetSlotType } from "./asset-catalog";

export type SelectedSource = {
  type: "video" | "pdf";
  id: number;
  title: string | null;
  sectionTitle: string | null;
  ai_readiness?: AIReadiness | null;
  has_transcript?: boolean | null;
  transcript_format?: string | null;
  transcript_source?: string | null;
  has_extracted_text?: boolean | null;
  text_extraction_status?: number | string | null;
  text_extraction_status_label?: string | null;
  presetAssetType?: AssetSlotType;
  presetTargetId?: number | null;
};

export type GenerateFormState = {
  summary: boolean;
  quiz: boolean;
  flashcards: boolean;
  assignment: boolean;
  interactive_activity: boolean;
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
  interactiveActivityStyle: "steps" | "scenario" | "practice";
  interactiveActivityStepsCount: string;
  interactiveActivityIncludeReflection: boolean;
};

export const SLOT_ORDER: AssetSlotType[] = [
  "summary",
  "quiz",
  "flashcards",
  "assignment",
  "interactive_activity",
];

export function defaultGenerateFormState(): GenerateFormState {
  return {
    summary: true,
    quiz: true,
    flashcards: true,
    assignment: false,
    interactive_activity: false,
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
    interactiveActivityStyle: "steps",
    interactiveActivityStepsCount: "5",
    interactiveActivityIncludeReflection: true,
  };
}
