import { describe, expect, it } from "vitest";
import {
  AI_JOB_STATUS,
  aiJobStatusBadge,
  isTerminalAIJobStatus,
  shouldPollAIJob,
  toAIJobStatus,
} from "@/features/ai/lib/job-status";

describe("ai job status helpers", () => {
  it("detects terminal statuses", () => {
    expect(isTerminalAIJobStatus(AI_JOB_STATUS.failed)).toBe(true);
    expect(isTerminalAIJobStatus(AI_JOB_STATUS.approved)).toBe(true);
    expect(isTerminalAIJobStatus(AI_JOB_STATUS.published)).toBe(true);
    expect(isTerminalAIJobStatus(AI_JOB_STATUS.discarded)).toBe(true);

    expect(isTerminalAIJobStatus(AI_JOB_STATUS.pending)).toBe(false);
    expect(isTerminalAIJobStatus(AI_JOB_STATUS.processing)).toBe(false);
    expect(isTerminalAIJobStatus(AI_JOB_STATUS.completed)).toBe(false);
  });

  it("polls only for pending or processing", () => {
    expect(shouldPollAIJob(AI_JOB_STATUS.pending)).toBe(true);
    expect(shouldPollAIJob(AI_JOB_STATUS.processing)).toBe(true);
    expect(shouldPollAIJob(AI_JOB_STATUS.completed)).toBe(false);
    expect(shouldPollAIJob(AI_JOB_STATUS.failed)).toBe(false);
  });

  it("returns status badge metadata", () => {
    expect(aiJobStatusBadge(AI_JOB_STATUS.pending)).toEqual({
      label: "Pending",
      tone: "neutral",
    });
    expect(aiJobStatusBadge(AI_JOB_STATUS.processing)).toEqual({
      label: "Processing",
      tone: "info",
    });
    expect(aiJobStatusBadge(999)).toEqual({
      label: "Unknown",
      tone: "neutral",
    });
  });

  it("normalizes numeric value to known status union", () => {
    expect(toAIJobStatus(AI_JOB_STATUS.pending)).toBe(0);
    expect(toAIJobStatus(AI_JOB_STATUS.published)).toBe(5);
    expect(toAIJobStatus(100)).toBeNull();
  });
});
