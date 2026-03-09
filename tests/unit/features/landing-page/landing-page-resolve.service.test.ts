import axios from "axios";
import { beforeEach, describe, expect, it, MockedFunction, vi } from "vitest";
import { defaultApiKey } from "@/lib/runtime-config";
import { resolveLandingPage } from "@/features/landing-page/services/landing-page-resolve.service";

vi.mock("axios", () => {
  const get = vi.fn();
  return {
    default: {
      get,
    },
    get,
  };
});

const mockedGet = axios.get as MockedFunction<typeof axios.get>;

describe("resolveLandingPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("sends locale headers and preview token", async () => {
    mockedGet.mockResolvedValue({ data: { slug: "foo" } });

    await resolveLandingPage("center-slug", {
      locale: "ar",
      previewToken: "preview-token",
    });

    expect(mockedGet).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/resolve/landing-page/center-slug"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Api-Key": defaultApiKey,
          "X-Locale": "ar",
          "Accept-Language": "ar",
        }),
        params: { preview_token: "preview-token" },
      }),
    );
  });

  it("unwraps nested data payloads", async () => {
    mockedGet.mockResolvedValue({ data: { data: { slug: "bar" } } });

    const result = await resolveLandingPage("center-slug");
    expect(result).toEqual({ slug: "bar" });
  });
});
