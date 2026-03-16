import type { AIContentTargetType } from "@/features/ai/types/ai";

export function resolveAIPublishRoute(params: {
  centerId: number | string;
  courseId: number | string;
  targetType: AIContentTargetType;
  targetId: number | string;
}): string {
  const { centerId, courseId, targetType, targetId } = params;

  switch (targetType) {
    case "quiz":
      return `/centers/${centerId}/courses/${courseId}/quizzes?highlight_id=${targetId}`;
    case "assignment":
      return `/centers/${centerId}/courses/${courseId}/assignments?highlight_id=${targetId}`;
    case "summary":
    case "flashcards":
    case "interactive_activity":
      return `/centers/${centerId}/ai-content?published_target=${targetType}&target_id=${targetId}`;
    default:
      return `/centers/${centerId}/ai-content`;
  }
}
