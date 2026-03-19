const AI_ERROR_MESSAGES: Record<string, string> = {
  AI_LIMIT_DAILY_JOBS_EXCEEDED: "Daily AI job limit reached for this center.",
  AI_LIMIT_MONTHLY_JOBS_EXCEEDED:
    "Monthly AI job limit reached for this center.",
  AI_LIMIT_DAILY_TOKENS_EXCEEDED:
    "Daily AI token limit reached for this center.",
  AI_LIMIT_MONTHLY_TOKENS_EXCEEDED:
    "Monthly AI token limit reached for this center.",
  AI_LIMIT_CONCURRENT_JOBS_EXCEEDED:
    "Too many AI jobs are currently processing. Try again shortly.",
  AI_LIMIT_INPUT_TOO_LARGE:
    "Input content is too large for this center limits.",
  AI_LIMIT_OUTPUT_TOO_LARGE: "Generated output exceeds center limits.",
  AI_PROVIDER_NOT_AVAILABLE:
    "Selected AI provider is not available for this center.",
  AI_PROVIDER_NOT_CONFIGURED: "Selected AI provider is not configured.",
  AI_MODEL_NOT_ALLOWED: "Selected model is not allowed for this provider.",
  TRANSCRIPT_NOT_FOUND:
    "This video is not AI-ready yet. Add a transcript before generating content.",
  PDF_NOT_READY:
    "This PDF is not AI-ready yet. Wait for text extraction to complete.",
  PDF_TEXT_EXTRACTION_FAILED:
    "PDF text extraction failed. Re-upload or replace the file before generating content.",
  INVALID_STATE: "This action is not allowed in the current job state.",
  VALIDATION_ERROR: "Please review and fix the highlighted fields.",
};

export function mapAIErrorCodeToMessage(code?: string, fallback?: string) {
  if (code && AI_ERROR_MESSAGES[code]) return AI_ERROR_MESSAGES[code];
  return fallback || "Something went wrong. Please try again.";
}

export function getAIErrorMessages() {
  return { ...AI_ERROR_MESSAGES };
}
