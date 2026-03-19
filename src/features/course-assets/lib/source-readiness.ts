import {
  resolvePdfExtractionReadiness,
  resolveVideoTranscriptReadiness,
} from "@/lib/ai-source-readiness";
import type { CourseAssetSource } from "../types/asset-catalog";
import type { SelectedSource } from "../types/generate-form";

type SupportedSource = CourseAssetSource | SelectedSource;

export type CourseAssetSourceReadinessKey =
  | "ready"
  | "transcript_missing"
  | "extraction_pending"
  | "extraction_processing"
  | "extraction_failed"
  | "extraction_skipped"
  | "unknown";

export type CourseAssetSourceReadiness = {
  key: CourseAssetSourceReadinessKey;
  isReady: boolean;
  isKnown: boolean;
  backendBadge?: string;
  backendTitle?: string;
  backendMessage?: string;
};

const KNOWN_READINESS_KEYS = new Set<CourseAssetSourceReadinessKey>([
  "ready",
  "transcript_missing",
  "extraction_pending",
  "extraction_processing",
  "extraction_failed",
  "extraction_skipped",
  "unknown",
]);

export function resolveCourseAssetSourceReadiness(
  source: SupportedSource | null | undefined,
): CourseAssetSourceReadiness {
  if (!source) {
    return {
      key: "unknown",
      isReady: false,
      isKnown: false,
    };
  }

  if (source.ai_readiness) {
    const r = source.ai_readiness;
    const key: CourseAssetSourceReadinessKey = KNOWN_READINESS_KEYS.has(
      r.code as CourseAssetSourceReadinessKey,
    )
      ? (r.code as CourseAssetSourceReadinessKey)
      : r.is_ready
        ? "ready"
        : "unknown";

    return {
      key,
      isReady: r.is_ready,
      isKnown: true,
      backendBadge: r.badge,
      backendTitle: r.title,
      backendMessage: r.message,
    };
  }

  if (source.type === "video") {
    const readiness = resolveVideoTranscriptReadiness(source);
    if (readiness.key === "missing") {
      return {
        key: "transcript_missing",
        isReady: false,
        isKnown: true,
      };
    }

    return {
      key: readiness.key === "ready" ? "ready" : "unknown",
      isReady: readiness.key === "ready",
      isKnown: readiness.key === "ready" ? true : readiness.isKnown,
    };
  }

  const readiness = resolvePdfExtractionReadiness(source);
  if (readiness.key === "pending") {
    return {
      key: "extraction_pending",
      isReady: false,
      isKnown: true,
    };
  }
  if (readiness.key === "processing") {
    return {
      key: "extraction_processing",
      isReady: false,
      isKnown: true,
    };
  }
  if (readiness.key === "failed") {
    return {
      key: "extraction_failed",
      isReady: false,
      isKnown: true,
    };
  }
  if (readiness.key === "skipped") {
    return {
      key: "extraction_skipped",
      isReady: false,
      isKnown: true,
    };
  }

  return {
    key: readiness.key === "ready" ? "ready" : "unknown",
    isReady: readiness.key === "ready",
    isKnown: readiness.key === "ready" ? true : readiness.isKnown,
  };
}
