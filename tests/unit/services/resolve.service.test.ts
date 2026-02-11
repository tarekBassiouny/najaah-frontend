import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { resolveCenter } from "@/services/resolve.service";

vi.mock("@/lib/runtime-config", () => ({
  apiBaseUrl: "https://api.example.com",
  defaultApiKey: "default-api-key",
  getApiLocale: vi.fn(() => "en"),
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxiosGet = axios.get as unknown as ReturnType<typeof vi.fn>;

describe("resolveCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls resolve endpoint with required headers", async () => {
    mockedAxiosGet.mockResolvedValueOnce({ data: {} });

    await resolveCenter("alpha");

    expect(mockedAxiosGet).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/resolve/centers/alpha",
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Api-Key": "default-api-key",
          "X-Locale": "en",
        },
      },
    );
  });

  it("normalizes nested data payload and branding keys", async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      data: {
        data: {
          api_key: "tenant-key",
          center_id: 25,
          center_slug: "alpha",
          branding: {
            logo_url: "https://cdn/logo.png",
            primary_color: "#112233",
          },
        },
      },
    });

    await expect(resolveCenter("alpha")).resolves.toEqual({
      apiKey: "tenant-key",
      centerId: 25,
      centerSlug: "alpha",
      centerName: null,
      branding: {
        logoUrl: "https://cdn/logo.png",
        primaryColor: "#112233",
        logo_url: "https://cdn/logo.png",
        primary_color: "#112233",
      },
    });
  });

  it("normalizes id/slug/name payload shape", async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 225,
          slug: "center-01",
          name: "Updated Name",
          api_key: "tenant-key-2",
          branding: {
            logo_url: "https://cdn/logo-2.png",
            primary_color: null,
          },
        },
      },
    });

    await expect(resolveCenter("center-01")).resolves.toEqual({
      apiKey: "tenant-key-2",
      centerId: 225,
      centerSlug: "center-01",
      centerName: "Updated Name",
      branding: {
        logoUrl: "https://cdn/logo-2.png",
        primaryColor: null,
        logo_url: "https://cdn/logo-2.png",
        primary_color: null,
      },
    });
  });

  it("returns null defaults for missing fields", async () => {
    mockedAxiosGet.mockResolvedValueOnce({ data: {} });

    await expect(resolveCenter("alpha")).resolves.toEqual({
      apiKey: undefined,
      centerId: null,
      centerSlug: null,
      centerName: null,
      branding: null,
    });
  });
});
