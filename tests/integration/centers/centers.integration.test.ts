import "../../setup/integration";
import { describe, expect, it } from "vitest";

describe("centers list (MSW)", () => {
  it("returns mocked centers list", async () => {
    const response = await fetch("/api/v1/admin/centers");
    const json = await response.json();

    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].name).toBe("Center A");
  });
});
