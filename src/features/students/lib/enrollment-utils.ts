import { isAxiosError } from "axios";
import type { TranslateFunction } from "@/features/localization";

export function extractFirstMessage(node: unknown): string | null {
  if (typeof node === "string" && node.trim()) {
    return node.trim();
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const message = extractFirstMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (!node || typeof node !== "object") return null;

  for (const value of Object.values(node as Record<string, unknown>)) {
    const message = extractFirstMessage(value);
    if (message) return message;
  }

  return null;
}

export function getEnrollErrorMessage(
  error: unknown,
  t?: TranslateFunction,
): string {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, unknown>;
          error?: {
            code?: string;
            message?: string;
            details?: unknown;
          };
        }
      | undefined;

    const detailsMessage = extractFirstMessage(data?.error?.details);
    if (detailsMessage) return detailsMessage;

    const validationMessage = extractFirstMessage(data?.errors);
    if (validationMessage) return validationMessage;

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (status === 401) {
      return t
        ? t("pages.students.dialogs.enroll.errors.sessionInvalid")
        : "Your session is invalid. Please sign in again.";
    }
    if (status === 403) {
      return t
        ? t("pages.students.dialogs.enroll.errors.permissionDenied")
        : "You do not have permission to enroll this student for the selected center.";
    }
    if (status === 404) {
      return t
        ? t("pages.students.dialogs.enroll.errors.courseNotFound")
        : "Selected course was not found for this center.";
    }
    if (status === 422) {
      return t
        ? t("pages.students.dialogs.enroll.errors.validation")
        : "Unable to create enrollment with the selected student/course.";
    }
  }

  return t
    ? t("pages.students.dialogs.enroll.errors.enrollFailed")
    : "Unable to enroll students. Please try again.";
}

export function isAlreadyEnrolledMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already enrolled") ||
    normalized.includes("already exists") ||
    normalized.includes("already has")
  );
}
