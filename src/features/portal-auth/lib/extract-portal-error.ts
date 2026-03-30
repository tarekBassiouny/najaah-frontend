import { isAxiosError } from "axios";

type ApiErrorData = {
  message?: string;
  code?: string;
  error?: {
    code?: string;
    message?: string;
  };
  errors?: Record<string, string[]>;
};

export function extractPortalErrorMessage(error: unknown): string {
  if (!isAxiosError<ApiErrorData>(error)) {
    return "An unexpected error occurred.";
  }

  const data = error.response?.data;

  // Backend wraps errors in { error: { code, message } }
  if (typeof data?.error?.message === "string" && data.error.message) {
    return data.error.message;
  }

  // Fallback: top-level message
  if (typeof data?.message === "string" && data.message) {
    return data.message;
  }

  // Validation errors: { errors: { field: ["msg"] } }
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length > 0) {
      return first[0];
    }
  }

  if (error.response?.status === 422) {
    return "Validation failed. Please check your input.";
  }

  if (error.response?.status === 403) {
    return "Access denied.";
  }

  return "An unexpected error occurred.";
}
