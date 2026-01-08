import { describe, expect, it } from "vitest";
import { compactFormat, standardFormat } from "@/lib/format-number";

describe("format-number utilities", () => {
  it("formats numbers in compact notation", () => {
    expect(compactFormat(1200)).toBe("1.2K");
    expect(compactFormat(1_200_000)).toBe("1.2M");
  });

  it("formats numbers with two decimals", () => {
    expect(standardFormat(1234.5)).toBe("1,234.50");
    expect(standardFormat(10)).toBe("10.00");
  });
});
