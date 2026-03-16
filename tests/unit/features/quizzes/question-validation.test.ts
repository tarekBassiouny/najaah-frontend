import { describe, expect, it } from "vitest";
import { validateQuizQuestionDraft } from "@/features/quizzes/lib/question-validation";

describe("validateQuizQuestionDraft", () => {
  it("returns no errors for valid single choice question", () => {
    const result = validateQuizQuestionDraft({
      questionEn: "What is 2 + 2?",
      questionType: 0,
      answers: [
        { textEn: "4", isCorrect: true },
        { textEn: "5", isCorrect: false },
      ],
    });

    expect(result).toEqual([]);
  });

  it("requires question text", () => {
    const result = validateQuizQuestionDraft({
      questionEn: "   ",
      questionType: 0,
      answers: [
        { textEn: "A", isCorrect: true },
        { textEn: "B", isCorrect: false },
      ],
    });

    expect(result).toContain("question_required");
  });

  it("validates single choice correct answers count", () => {
    const result = validateQuizQuestionDraft({
      questionEn: "Pick one",
      questionType: 0,
      answers: [
        { textEn: "A", isCorrect: true },
        { textEn: "B", isCorrect: true },
      ],
    });

    expect(result).toContain("single_correct_exactly_one");
  });

  it("validates multiple choice requires at least one correct answer", () => {
    const result = validateQuizQuestionDraft({
      questionEn: "Pick many",
      questionType: 1,
      answers: [
        { textEn: "A", isCorrect: false },
        { textEn: "B", isCorrect: false },
      ],
    });

    expect(result).toContain("multiple_correct_at_least_one");
  });

  it("validates answer count boundaries", () => {
    const tooFew = validateQuizQuestionDraft({
      questionEn: "Question",
      questionType: 0,
      answers: [{ textEn: "Only one", isCorrect: true }],
    });
    expect(tooFew).toContain("answers_min");

    const tooMany = validateQuizQuestionDraft({
      questionEn: "Question",
      questionType: 1,
      answers: Array.from({ length: 11 }).map((_, index) => ({
        textEn: `Option ${index + 1}`,
        isCorrect: index === 0,
      })),
    });
    expect(tooMany).toContain("answers_max");
  });
});
