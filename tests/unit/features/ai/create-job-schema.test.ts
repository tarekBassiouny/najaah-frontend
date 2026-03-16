import { describe, expect, it } from "vitest";
import {
  generationDefaults,
  validateCreateJob,
} from "@/features/ai/lib/create-job-schema";

describe("create-job schema helpers", () => {
  it("exposes defaults for all targets", () => {
    expect(generationDefaults.summary).toEqual({
      length: "medium",
      tone: "simple",
      bullet_points: true,
      include_key_terms: true,
    });
    expect(generationDefaults.quiz.question_count).toBe(10);
    expect(generationDefaults.assignment.max_points).toBe(100);
    expect(generationDefaults.flashcards.cards_count).toBe(20);
    expect(generationDefaults.interactive_activity.steps_count).toBe(5);
  });

  it("validates required create-job fields", () => {
    const errors = validateCreateJob({
      course_id: 0,
      source_type: "video",
      source_id: 0,
      target_type: "summary",
      ai_provider: "" as never,
      ai_model: "",
    });

    expect(errors).toEqual([
      "Course is required.",
      "Source is required.",
      "AI provider is required.",
      "AI model is required.",
    ]);
  });

  it("validates quiz question count bounds", () => {
    const errors = validateCreateJob({
      course_id: 1,
      source_type: "course",
      source_id: 1,
      target_type: "quiz",
      ai_provider: "gemini",
      ai_model: "gemini-2.0-flash",
      generation_config: {
        question_count: 0,
      },
    });

    expect(errors).toContain("Question count must be between 1 and 50.");
  });

  it("validates flashcards count bounds", () => {
    const errors = validateCreateJob({
      course_id: 1,
      source_type: "section",
      source_id: 11,
      target_type: "flashcards",
      ai_provider: "gemini",
      ai_model: "gemini-2.0-flash",
      generation_config: {
        cards_count: 101,
      },
    });

    expect(errors).toContain("Cards count must be between 1 and 100.");
  });

  it("validates interactive steps count bounds", () => {
    const errors = validateCreateJob({
      course_id: 1,
      source_type: "pdf",
      source_id: 11,
      target_type: "interactive_activity",
      ai_provider: "gemini",
      ai_model: "gemini-2.0-flash",
      generation_config: {
        steps_count: 21,
      },
    });

    expect(errors).toContain("Steps count must be between 1 and 20.");
  });

  it("validates assignment passing score is not greater than max points", () => {
    const errors = validateCreateJob({
      course_id: 1,
      source_type: "course",
      source_id: 1,
      target_type: "assignment",
      ai_provider: "gemini",
      ai_model: "gemini-2.0-flash",
      generation_config: {
        max_points: 50,
        passing_score: 60,
      },
    });

    expect(errors).toContain("Passing score cannot exceed max points.");
  });

  it("accepts a valid payload", () => {
    const errors = validateCreateJob({
      course_id: 1,
      source_type: "course",
      source_id: 1,
      target_type: "summary",
      ai_provider: "gemini",
      ai_model: "gemini-2.0-flash",
      generation_config: {
        length: "short",
      },
    });

    expect(errors).toEqual([]);
  });
});
