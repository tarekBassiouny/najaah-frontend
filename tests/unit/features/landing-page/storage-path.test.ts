import { describe, expect, it } from "vitest";
import { normalizeStorageAssetPath } from "@/features/landing-page/lib/storage-path";

describe("normalizeStorageAssetPath", () => {
  it("strips the host and query string from signed storage urls", () => {
    expect(
      normalizeStorageAssetPath(
        "https://bucket.example.test/centers/3/landing-page/testimonials/author.png?X-Amz-Signature=abc",
      ),
    ).toBe("centers/3/landing-page/testimonials/author.png");
  });

  it("keeps plain storage paths untouched", () => {
    expect(
      normalizeStorageAssetPath(
        "centers/3/landing-page/testimonials/author.png",
      ),
    ).toBe("centers/3/landing-page/testimonials/author.png");
  });

  it("does not rewrite external urls", () => {
    expect(
      normalizeStorageAssetPath("https://images.example.com/author.png"),
    ).toBe("https://images.example.com/author.png");
  });
});
