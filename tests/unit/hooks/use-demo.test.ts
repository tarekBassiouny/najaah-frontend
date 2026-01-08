import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function useDemo() {
  return 1;
}

describe("useDemo hook (placeholder)", () => {
  it("returns value", () => {
    const { result } = renderHook(() => useDemo());
    expect(result.current).toBe(1);
  });
});
