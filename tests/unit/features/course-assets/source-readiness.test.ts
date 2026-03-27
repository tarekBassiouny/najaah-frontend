import { describe, expect, it } from "vitest";
import { resolveCourseAssetSourceReadiness } from "@/features/course-assets/lib/source-readiness";

describe("resolveCourseAssetSourceReadiness", () => {
  it("prefers backend readiness when present", () => {
    expect(
      resolveCourseAssetSourceReadiness({
        type: "pdf",
        id: 3,
        title: "Notes",
        order_index: 1,
        section: null,
        assets: [],
        ai_readiness: {
          is_ready: false,
          code: "extraction_failed",
          badge: "Extraction failed",
          title: "PDF not ready",
          message: "Upload another file.",
        },
      }),
    ).toEqual({
      key: "extraction_failed",
      isReady: false,
      isKnown: true,
      backendBadge: "Extraction failed",
      backendTitle: "PDF not ready",
      backendMessage: "Upload another file.",
    });
  });

  it("maps missing video transcripts to transcript_missing", () => {
    expect(
      resolveCourseAssetSourceReadiness({
        type: "video",
        id: 5,
        title: "Lecture",
        sectionTitle: "Week 1",
        has_transcript: false,
      }),
    ).toEqual({
      key: "transcript_missing",
      isReady: false,
      isKnown: true,
    });
  });

  it("maps completed PDF extraction status to ready", () => {
    expect(
      resolveCourseAssetSourceReadiness({
        type: "pdf",
        id: 9,
        title: "Workbook",
        sectionTitle: "Unit 2",
        text_extraction_status: "completed",
      }),
    ).toEqual({
      key: "ready",
      isReady: true,
      isKnown: true,
    });
  });

  it("falls back to unknown when no readiness information exists", () => {
    expect(
      resolveCourseAssetSourceReadiness({
        type: "pdf",
        id: 9,
        title: "Workbook",
        sectionTitle: "Unit 2",
      }),
    ).toEqual({
      key: "unknown",
      isReady: false,
      isKnown: false,
    });
  });
});
