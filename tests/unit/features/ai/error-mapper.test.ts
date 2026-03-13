import { describe, expect, it } from "vitest";
import {
  getAIErrorMessages,
  mapAIErrorCodeToMessage,
} from "@/features/ai/lib/error-mapper";

describe("ai error mapper", () => {
  it("maps known backend codes", () => {
    expect(mapAIErrorCodeToMessage("AI_MODEL_NOT_ALLOWED")).toBe(
      "Selected model is not allowed for this provider.",
    );
  });

  it("falls back to provided message for unknown codes", () => {
    expect(
      mapAIErrorCodeToMessage("SOMETHING_NEW", "Custom fallback message"),
    ).toBe("Custom fallback message");
  });

  it("returns default fallback when no code matches", () => {
    expect(mapAIErrorCodeToMessage("SOMETHING_NEW")).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("returns a defensive copy of messages map", () => {
    const messages = getAIErrorMessages();
    messages.AI_MODEL_NOT_ALLOWED = "Changed";

    expect(mapAIErrorCodeToMessage("AI_MODEL_NOT_ALLOWED")).toBe(
      "Selected model is not allowed for this provider.",
    );
  });
});
