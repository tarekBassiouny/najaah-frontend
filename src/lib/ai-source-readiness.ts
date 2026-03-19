type TranscriptReadyLike = {
  has_transcript?: boolean | null;
};

type PdfExtractionLike = {
  has_extracted_text?: boolean | null;
  text_extraction_status?: number | string | null;
};

export type VideoTranscriptReadinessKey = "ready" | "missing" | "unknown";

export type PdfExtractionReadinessKey =
  | "ready"
  | "pending"
  | "processing"
  | "failed"
  | "skipped"
  | "unknown";

export function resolveVideoTranscriptReadiness(
  source: TranscriptReadyLike | null | undefined,
): {
  key: VideoTranscriptReadinessKey;
  isReady: boolean;
  isKnown: boolean;
} {
  if (source?.has_transcript === true) {
    return {
      key: "ready",
      isReady: true,
      isKnown: true,
    };
  }

  if (source?.has_transcript === false) {
    return {
      key: "missing",
      isReady: false,
      isKnown: true,
    };
  }

  return {
    key: "unknown",
    isReady: false,
    isKnown: false,
  };
}

function normalizeExtractionStatus(status: unknown): PdfExtractionReadinessKey {
  if (typeof status === "number") {
    if (status === 0) return "pending";
    if (status === 1) return "processing";
    if (status === 2) return "ready";
    if (status === 3) return "failed";
    if (status === 4) return "skipped";
    return "unknown";
  }

  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) return "unknown";
  if (normalized === "pending") return "pending";
  if (normalized === "processing") return "processing";
  if (normalized === "completed" || normalized === "ready") return "ready";
  if (normalized === "failed" || normalized === "error") return "failed";
  if (normalized === "skipped") return "skipped";
  return "unknown";
}

export function resolvePdfExtractionReadiness(
  source: PdfExtractionLike | null | undefined,
): {
  key: PdfExtractionReadinessKey;
  isReady: boolean;
  isKnown: boolean;
} {
  const normalizedStatus = normalizeExtractionStatus(
    source?.text_extraction_status,
  );

  if (normalizedStatus !== "unknown") {
    return {
      key: normalizedStatus,
      isReady: normalizedStatus === "ready",
      isKnown: true,
    };
  }

  if (source?.has_extracted_text === true) {
    return {
      key: "ready",
      isReady: true,
      isKnown: true,
    };
  }

  if (source?.has_extracted_text === false) {
    return {
      key: "pending",
      isReady: false,
      isKnown: true,
    };
  }

  return {
    key: "unknown",
    isReady: false,
    isKnown: false,
  };
}
