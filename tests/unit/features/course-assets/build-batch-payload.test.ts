import { describe, expect, it } from "vitest";
import { toAssetBatchPayload } from "@/features/course-assets/lib/build-batch-payload";
import { defaultGenerateFormState } from "@/features/course-assets/types/generate-form";

const selectedSource = {
  type: "video" as const,
  id: 42,
  title: "Lesson 1",
  sectionTitle: "Intro",
};

describe("toAssetBatchPayload", () => {
  it("builds the default payload for enabled assets", () => {
    const payload = toAssetBatchPayload(
      defaultGenerateFormState(),
      selectedSource,
    );

    expect(payload).toEqual([
      {
        target_type: "summary",
        target_id: null,
        generation_config: {
          length: "medium",
          include_key_points: true,
        },
      },
      {
        target_type: "quiz",
        target_id: null,
        generation_config: {
          question_count: 10,
          difficulty: "medium",
          question_styles: ["single_choice", "true_false"],
        },
      },
      {
        target_type: "flashcards",
        target_id: null,
        generation_config: {
          card_count: 15,
          focus: ["definitions", "concepts"],
        },
      },
    ]);
  });

  it("sanitizes invalid empty and out-of-range config values", () => {
    const form = {
      ...defaultGenerateFormState(),
      assignment: true,
      interactive_activity: true,
      quizQuestionCount: "0",
      quizStyleSingleChoice: false,
      quizStyleMultipleChoice: false,
      quizStyleTrueFalse: false,
      flashcardsCount: "-3",
      flashcardsFocusDefinitions: false,
      flashcardsFocusConcepts: false,
      flashcardsFocusFormulas: false,
      assignmentAllowFile: false,
      assignmentAllowText: false,
      assignmentAllowLink: false,
      assignmentMaxPoints: "0",
      interactiveActivityStepsCount: "99",
    };

    const payload = toAssetBatchPayload(form, selectedSource);

    expect(payload).toEqual([
      {
        target_type: "summary",
        target_id: null,
        generation_config: {
          length: "medium",
          include_key_points: true,
        },
      },
      {
        target_type: "quiz",
        target_id: null,
        generation_config: {
          question_count: 1,
          difficulty: "medium",
          question_styles: ["single_choice"],
        },
      },
      {
        target_type: "flashcards",
        target_id: null,
        generation_config: {
          card_count: 1,
          focus: ["definitions"],
        },
      },
      {
        target_type: "assignment",
        target_id: null,
        generation_config: {
          assignment_style: "practice",
          submission_types: [0],
          max_points: 1,
        },
      },
      {
        target_type: "interactive_activity",
        target_id: null,
        generation_config: {
          activity_style: "steps",
          steps_count: 20,
          include_reflection: true,
        },
      },
    ]);
  });

  it("preserves preset target ids only for the matching asset type", () => {
    const form = {
      ...defaultGenerateFormState(),
      summary: false,
      flashcards: false,
      assignment: false,
      interactive_activity: false,
    };

    const payload = toAssetBatchPayload(form, {
      ...selectedSource,
      presetAssetType: "quiz",
      presetTargetId: 88,
    });

    expect(payload).toEqual([
      {
        target_type: "quiz",
        target_id: 88,
        generation_config: {
          question_count: 10,
          difficulty: "medium",
          question_styles: ["single_choice", "true_false"],
        },
      },
    ]);
  });
});
