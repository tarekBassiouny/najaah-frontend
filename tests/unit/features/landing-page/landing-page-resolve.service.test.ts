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

const defaultLayout = {
  section_order: ["hero", "about", "courses", "testimonials", "contact"],
  section_layouts: {
    hero: "default",
    about: "default",
    courses: "default",
    testimonials: "default",
    contact: "default",
  },
  section_styles: {
    hero: {},
    about: {},
    courses: {},
    testimonials: {},
    contact: {},
  },
};

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
    mockedGet.mockResolvedValue({
      data: {
        data: {
          slug: "bar",
          hero: {
            title: "Localized hero",
            background_url: "https://cdn.example.test/hero.jpg",
          },
          sections: {
            show_hero: true,
            show_courses: false,
          },
        },
      },
    });

    const result = await resolveLandingPage("center-slug");
    expect(result).toEqual({
      slug: "bar",
      hero: {
        hero_title: { en: "Localized hero", ar: null },
        hero_subtitle: null,
        hero_cta_text: undefined,
        hero_cta_url: undefined,
        hero_background_url: "https://cdn.example.test/hero.jpg",
      },
      about: null,
      contact: null,
      visibility: {
        show_hero: true,
        show_about: undefined,
        show_courses: false,
        show_testimonials: undefined,
        show_contact: undefined,
      },
      testimonials: null,
      status: undefined,
      is_published: undefined,
      show_courses: false,
      meta: null,
      social: null,
      styling: null,
      center: null,
      layout: defaultLayout,
    });
  });
});
