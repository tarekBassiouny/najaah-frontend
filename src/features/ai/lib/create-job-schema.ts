import type {
  AssignmentGenerationConfig,
  CreateJobPayload,
  FlashcardsGenerationConfig,
  GenerationConfigByTarget,
  InteractiveActivityGenerationConfig,
  QuizGenerationConfig,
  TargetType,
} from "@/features/ai/types/ai";

export const generationDefaults: {
  [K in TargetType]: GenerationConfigByTarget[K];
} = {
  quiz: {
    question_count: 10,
    difficulty: "medium",
    include_explanations: true,
    focus_topics: [],
  },
  assignment: {
    assignment_type: "homework",
    max_points: 100,
    passing_score: 60,
    submission_types: [0],
    rubric_style: "basic",
  },
  summary: {
    length: "medium",
    tone: "simple",
    bullet_points: true,
    include_key_terms: true,
  },
  flashcards: {
    cards_count: 20,
    difficulty: "medium",
    include_definitions: true,
  },
  interactive_activity: {
    activity_style: "steps",
    steps_count: 5,
    estimated_minutes: 15,
    include_reflection: true,
  },
};

export function validateCreateJob(payload: CreateJobPayload<TargetType>) {
  const errors: string[] = [];

  if (!payload.course_id) errors.push("Course is required.");
  if (!payload.source_id) errors.push("Source is required.");
  if (!payload.ai_provider) errors.push("AI provider is required.");
  if (!payload.ai_model) errors.push("AI model is required.");

  if (payload.target_type === "quiz") {
    const config = payload.generation_config as
      | QuizGenerationConfig
      | undefined;
    if (
      config?.question_count !== undefined &&
      (config.question_count < 1 || config.question_count > 50)
    ) {
      errors.push("Question count must be between 1 and 50.");
    }
  }

  if (payload.target_type === "flashcards") {
    const config = payload.generation_config as
      | FlashcardsGenerationConfig
      | undefined;
    if (
      config?.cards_count !== undefined &&
      (config.cards_count < 1 || config.cards_count > 100)
    ) {
      errors.push("Cards count must be between 1 and 100.");
    }
  }

  if (payload.target_type === "interactive_activity") {
    const config = payload.generation_config as
      | InteractiveActivityGenerationConfig
      | undefined;
    if (
      config?.steps_count !== undefined &&
      (config.steps_count < 1 || config.steps_count > 20)
    ) {
      errors.push("Steps count must be between 1 and 20.");
    }
  }

  if (payload.target_type === "assignment") {
    const config = payload.generation_config as
      | AssignmentGenerationConfig
      | undefined;
    if (
      config?.passing_score !== undefined &&
      config.max_points !== undefined &&
      config.passing_score > config.max_points
    ) {
      errors.push("Passing score cannot exceed max points.");
    }
  }

  return errors;
}
