import type { AssetSlotState, AssetSlotType } from "../types/asset-catalog";

export const STATUS_BADGE_VARIANTS = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
} as const;

export function slotStateBadgeVariant(
  state: AssetSlotState,
): "outline" | "secondary" | "info" | "warning" | "success" | "error" {
  switch (state) {
    case "draft":
      return "secondary";
    case "generating":
      return "info";
    case "review_required":
      return "warning";
    case "approved":
      return "info";
    case "published":
      return "success";
    case "failed":
      return "error";
    case "missing":
    default:
      return "outline";
  }
}

export function isCourseAssetSlotType(value: string): value is AssetSlotType {
  return (
    value === "summary" ||
    value === "quiz" ||
    value === "flashcards" ||
    value === "assignment"
  );
}
